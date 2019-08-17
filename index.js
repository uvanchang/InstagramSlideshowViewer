const postIDs = [];
var media = [];
var mediaIndex = 0;
var firstRun = true;
var id = '';

var startT;

window.onload = async() => {

  var username = prompt("Enter the username of the Instagram page you would like to slideshow.");

  startT = new Date();

  var isValid = await isValidUsername(username);

  while(!isValid) {
    username = prompt("Invalid Username.\nEnter the username of the Instagram page you would like to slideshow.");
    isValid = await isValidUsername(username);
  }
  console.log('finished checking valid:' + (new Date() - startT));
  await getFirstPostIDsSet(username);
  console.log('finished getting first set:' + (new Date() - startT));
  var promises = [];

  for(var i = 0; i < postIDs.length; i++) {
    promises.push(getMediaFromPost(postIDs[i]));
  }

  Promise.all(promises);

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
  console.log('start fetch:' + (new Date() - startT));
  await fetch('https://instagram.com/' + username + '?__a=1')
    .then(function(response) {
      return response.json();
    }).then(function(response) { // real profile
      if(response.graphql.user.is_private) {
        valid = false;
      }
    }).catch(function(response) { // not real profile
      valid = false;
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

  var links = []

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
    media.push(...data);
    if(firstRun) {
      firstRun = false;
      console.log('finished first post:' + (new Date() - startT));
      showSlides();
    }
  });

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
