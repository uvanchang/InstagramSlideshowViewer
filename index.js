const queryHash = 'f2405b236d85e8296cf30347c9f08c2a',
      ms = 5000;
var postIDs = [],
    media = [],
    mediaIndex = 0,
    id = '',
    endCursor = '',
    hasNextPage = false,
    isGettingMore = false,
    isWaiting = false,
    isPaused = false,
    start,
    timeRemaining = 0,
    timer;

var startT;

window.onload = async() => {

  var username = prompt("Enter the username of the public Instagram profile you would like to slideshow.");

  startT = Date.now();

  var isValid = await isValidUsername(username);

  while(!isValid) {
    username = prompt("Invalid Username or profile is private.\nEnter the username of the public Instagram page you would like to slideshow.");
    isValid = await isValidUsername(username);
  }

  await getFirstPostIDsSet(username);
  await getMediaFromPost(postIDs[0]);
  document.getElementById('loader').style.display = 'none';
  showSlides(ms);

  await Promise.all(postIDs.slice(1).map(item => getMediaFromPost(item)));
  
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
    postIDs = shuffle(postIDs);

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

    for(var edge of shuffle(edges)) {

      try { // has multiple media
        for(var picture of edge.node.edge_sidecar_to_children.edges) {
          if(picture.node.is_video) {
            media.push(picture.node.video_url);
          } else {
            media.push(picture.node.display_url);
          }
        }
      } catch(err) { // has single media
        if(edge.node.is_video) {
          media.push(edge.node.video_url);
        } else {
          media.push(edge.node.display_url);
        }
      }

    }

    isGettingMore = false;

  });

}

async function showSlides(interval) {

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
    timeRemaining = ms;
    start = Date.now();
    timer = setTimeout(function() {
      showSlides(ms);
    }, interval); // Change to next media after 5 seconds
  }

}

// Change to next media after video ends
document.getElementsByTagName('video')[0].onended = function(e) {
  showSlides(ms);
}

document.addEventListener('keydown', function(event) {
    if(event.keyCode == 37) {
        plusSlides(-1);
    } else if(event.keyCode == 39) {
        plusSlides(1);
    } else if(event.keyCode == 32) {
      toggleTimer();
    }
});

document.getElementsByTagName('img')[0].addEventListener('click', toggleTimer);
document.getElementsByTagName('video')[0].addEventListener('click', toggleTimer);

function toggleTimer() {
  if(isPaused) {
    var video = document.getElementsByTagName('video')[0];
    if(video.firstChild) {
      video.play();
    } else {
      start = Date.now();
      timer = setTimeout(function() {
        showSlides(ms);
      }, timeRemaining);
    }
  } else {
    var video = document.getElementsByTagName('video')[0];
    if(video.firstChild) {
      video.pause();
    } else {
      timeRemaining -= Date.now() - start;
      clearTimeout(timer);
    }
  }
  isPaused = !isPaused;
}

function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;

  while (0 !== currentIndex) {

    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

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
  showSlides(ms);

}

