var postIDs = [];
var media = [];
var mediaIndex = 0;
var id = '';
var endCursor = '';
var hasNextPage = false;
var first = true;

var startT;

window.onload = async() => {

  var username = prompt("Enter the username of the Instagram page you would like to slideshow.");

  startT = new Date();

  var isValid = await isValidUsername(username);

  while(!isValid) {
    username = prompt("Invalid Username.\nEnter the username of the Instagram page you would like to slideshow.");
    isValid = await isValidUsername(username);
  }
  //console.log('finished checking valid:' + (new Date() - startT));
  await getFirstPostIDsSet(username);
  //console.log('finished getting first set:' + (new Date() - startT));

  Promise.all(postIDs.map(item => getMediaFromPost(item)));

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

function showSlides() {
  // TODO: add more posts when low
  var image = document.getElementsByTagName('img')[0];
  var video = document.getElementsByTagName('video')[0];
  if(image.src) {
    image.style.display = 'none';
  }
  if(video.firstChild) {
    video.style.display = 'none';
    video.removeChild(video.firstChild);
  }
  mediaIndex++;
  if(mediaIndex > media.length) {mediaIndex = 1;}
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
    setTimeout(showSlides, 5000); // Change to next media after 5 seconds
  }
}

// Change to next media after video ends
document.getElementsByTagName('video')[0].onended = function(e) {
  showSlides();
}
