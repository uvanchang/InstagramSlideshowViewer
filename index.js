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
        media.push(picture.node.display_url);
      }
    } catch {
      media.push(data.graphql.shortcode_media.display_url);
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
  console.log(images.length);
  var i;
  imageIndex++;
  if (imageIndex > images.length) {imageIndex = 1;}
  document.getElementsByTagName('img')[0].src = images[imageIndex - 1];
  setTimeout(showSlides, 5000); // Change image every 5 seconds
}

const postID = ''
var images = [];
var imageIndex = 0;

getMediaFromPost(postID)
  .then(result => {
    images.push(...result);
    showSlides()
  });
