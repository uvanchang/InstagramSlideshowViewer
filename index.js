const queryHash = 'f2405b236d85e8296cf30347c9f08c2a';
var postIDs = [],
    media = [],
    mediaIndex = 0,
    id = '',
    endCursor = '',
    hasNextPage = false,
    first = true,
    isGettingMore = false,
    isWaiting = false,
    timer;

var startT;

window.onload = async() => {

  var username = prompt("Enter the username of the public Instagram profile you would like to slideshow.");

  startT = new Date();

  var isValid = await isValidUsername(username);

  while(!isValid) {
    username = prompt("Invalid Username or profile is private.\nEnter the username of the public Instagram page you would like to slideshow.");
    isValid = await isValidUsername(username);
  }
  //console.log('finished checking valid:' + (new Date() - startT));
  await getFirstPostIDsSet(username);
  //console.log('finished getting first set:' + (new Date() - startT));

  await Promise.all(postIDs.map(item => getMediaFromPost(item)));

}

async function isValidUsername(username) {

  try {
    if(username === '' || username.includes(' ')) {
      return false;
    }
  } catch(err) { // clicked cancel button on prompt
    location.reload();
  }

  var valid = true;
  await fetch('https://instagram.com/' + username + '?__a=1')
    .then(function(response) {
      return response.json();
    }).then(function(response) { // profile exists
      if(response.graphql.user.is_private) {
        valid = false;
      }
    }).catch(function(response) { // profile does not exist
      valid = false;
    });

  return valid;

}

async function getFirstPostIDsSet(username) {

  const response = await fetch('https://instagram.com/' + username + '?__a=1');
  await response.json().then(data => {

    id = data.graphql.user.id;
    endCursor = data.graphql.user.edge_owner_to_timeline_media.page_info.end_cursor;
    hasNextPage = data.graphql.user.edge_owner_to_timeline_media.page_info.has_next_page;
    const edges = data.graphql.user.edge_owner_to_timeline_media.edges;

    for(var i = 0; i < edges.length; i++) {
      postIDs.push(edges[i].node.shortcode);
    }

  });

}

async function getMediaFromPost(postID) {

  const response = await fetch('https://instagram.com/p/' + postID + '?__a=1');
  await response.json().then(data => {

    try { // has multiple media
      for(var picture of data.graphql.shortcode_media.edge_sidecar_to_children.edges) {
	       if(picture.node.is_video) {
          media.push(picture.node.video_url);
        } else {
          media.push(picture.node.display_url);
        }
      }
    } catch(err) { // has single media
      if(data.graphql.shortcode_media.is_video) {
        media.push(data.graphql.shortcode_media.video_url);
      } else {
        media.push(data.graphql.shortcode_media.display_url);
      }
    }

  });

  if(first) {
    first = false;
    console.log('finished first post:' + (new Date() - startT));
    document.getElementById('loader').style.display = 'none';
    showSlides();
  }

}

async function getNextPosts() {

  isGettingMore = true;

  var url = new URL('https://instagram.com/graphql/query/');
  var params = {
    query_hash:queryHash,
    variables:JSON.stringify({
      id:id,
      first:12,
      after:endCursor
    })};
  url.search = new URLSearchParams(params)

  const response = await fetch(url);
  await response.json().then(data => {

    endCursor = data.data.user.edge_owner_to_timeline_media.page_info.end_cursor;
    hasNextPage = data.data.user.edge_owner_to_timeline_media.page_info.has_next_page;
    const edges = data.data.user.edge_owner_to_timeline_media.edges;

    for(var i = 0; i < edges.length; i++) {

      try { // has multiple media
        for(var picture of edges[i].node.edge_sidecar_to_children.edges) {
  	       if(picture.node.is_video) {
            media.push(picture.node.video_url);
          } else {
            media.push(picture.node.display_url);
          }
        }
      } catch(err) { // has single media
        if(edges[i].node.is_video) {
          media.push(edges[i].node.video_url);
        } else {
          media.push(edges[i].node.display_url);
        }
      }

    }

    isGettingMore = false;

  });

}

async function showSlides() {

  var image = document.getElementsByTagName('img')[0];
  var video = document.getElementsByTagName('video')[0];
  if(image.src) {
    image.style.display = 'none';
  }
  if(video.firstChild) {
    video.style.display = 'none';
    video.removeChild(video.firstChild);
  }
  document.getElementById('loader').style.display = 'block';

  mediaIndex++;
  if(mediaIndex > media.length) {
    if(isGettingMore) {
      isWaiting = true;
      while(isGettingMore) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      isWaiting = false;
    } else {
      mediaIndex = 1;
    }
  }
  if(mediaIndex + 4 == media.length && hasNextPage) {
    getNextPosts();
  }

  document.getElementById('loader').style.display = 'none';
  if(media[mediaIndex - 1].includes('mp4')) {
    video.style.display = 'grid';
    var source = document.createElement('source');
    source.setAttribute('src', media[mediaIndex - 1]);
    video.appendChild(source);
    video.load();
    video.play();
  } else {
    image.style.display = 'grid';
    image.src = media[mediaIndex - 1];
    timer = setTimeout(showSlides, 5000); // Change to next media after 5 seconds
  }

}

// Change to next media after video ends
document.getElementsByTagName('video')[0].onended = function(e) {
  showSlides();
}

function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;

}

function plusSlides(num) {

  var video = document.getElementsByTagName('video')[0];

  if(!timer && !video.firstChild || isWaiting || mediaIndex == 1 && num == -1 && hasNextPage) {
    return;
  }

  if(mediaIndex == 1 && num == -1 && !hasNextPage) {
    mediaIndex = media.length;
  }

  if(video.firstChild) {
    video.pause();
  } else {
    clearTimeout(timer);
  }
  mediaIndex += num - 1;
  showSlides();

}
