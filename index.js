const postIDs = [];
var media = [];
var mediaIndex = 0;
var firstRun = true;
var id = '';

window.onload = async() => {

  var username = prompt("Enter the username of the Instagram page you would like to slideshow.");
  var isValid = await isValidUsername(username);

  while(!isValid) {
    username = prompt("Invalid Username.\nEnter the username of the Instagram page you would like to slideshow.");
    isValid = await isValidUsername(username);
  }

  await getFirstPostIDsSet(username);

  for(var i = 0; i < postIDs.length; i++) {
    getMediaFromPost(postIDs[i])
      .then(result => {
        media.push(...result);
        if(firstRun) {
          firstRun = false;
          showSlides();
        }
    });
  }

}

const isValidUsername = async(username) => {

  try {
    if(username === '' || username.includes(' ')) {
      return false;
    }
  } catch(err) {
    // clicked cancel button on prompt
    location.reload();
  }

  var valid = true;

  await fetch('https://instagram.com/' + username)
    .then(function(response) {
      // TODO: fix for private profiles
      if(!response.ok) {
        valid = false;
      }
    });

  return valid;

}

const getFirstPostIDsSet = async(username) => {

  var formBody = new URLSearchParams();
  formBody.append('pid', username);

  const response = await fetch('https://instagram-slideshow-viewer.glitch.me/pid', {
    method: 'POST',
    body: formBody,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json'
    }
  });
  await response.json().then(data => {

    // TODO: get the end_cursor and store
    id = data.id;
    var firstPostIDs = data.postIDs;

    postIDs.push(...firstPostIDs);

  });

}

const getMediaFromPost = async(postID) => {

  var media = []

  var formBody = new URLSearchParams();
  formBody.append('p', postID);

  const response = await fetch('https://instagram-slideshow-viewer.glitch.me/p', {
    method: 'POST',
    body: formBody,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json'
    }
  });
  await response.json().then(data => {
    media = data;
  });

  return media;

}

function showSlides() {

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
    setTimeout(showSlides, 5000); // Change image every 5 seconds
  }
}

document.getElementsByTagName('video')[0].onended = function(e) {
  showSlides();
}
