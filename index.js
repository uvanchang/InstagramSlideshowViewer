const getMediaFromPost = async(postID) => {

  var media = []

  var formBody = new URLSearchParams();
  formBody.append('p', postID);

  const response = await fetch('https://instagram-slideshow-viewer.glitch.me/p', {
    method: 'POST',
    body: formBody,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });
  await response.json().then(data => {

    try {
      for(var picture of data.graphql.shortcode_media.edge_sidecar_to_children.edges) {
	if(picture.node.is_video) { 
          media.push(picture.node.video_url);
        } else {
          media.push(picture.node.display_url);
        }
      }
    } catch {
      if(data.graphql.shortcode_media.is_video) {
        media.push(data.graphql.shortcode_media.video_url);
      } else {
        media.push(data.graphql.shortcode_media.display_url);
      }
    }
    for(m of media){
      console.log(m);
    }

  });

  return new Promise(function(resolve, reject) {
    resolve(media);
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

};

// TODO: fix so it cycles posts in postIDs

const postIDs = ['BpnZWq0BlJm', 'B1Cy-hppWXa'];
var media = [];
var mediaIndex = 0;
var firstRun = true;

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
