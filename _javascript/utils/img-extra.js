/**
  Lazy load images (https://github.com/ApoorvSaxena/lozad.js)
  and popup when clicked (https://github.com/dimsemenov/Magnific-Popup)
*/

$(function() {

  const IMG_SCOPE = 'div.row';

  if ($(`${IMG_SCOPE} img`).length <= 0 ) {
    return;
  }

  const imgList = document.querySelectorAll(`${IMG_SCOPE} img[data-src]`);

  /* preventing image reflow */

  imgList.forEach(img => {
    if (img.classList.contains("preview-img")) {
      return;
    }

    if (img.hasAttribute("width") && img.hasAttribute("height")) {
      const width = img.getAttribute("width");
      const height = img.getAttribute("height");
      let srcPlaceholder =
        `data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}"%3E%3C/svg%3E`;
      img.setAttribute("src", srcPlaceholder);
    }
  });

  /* lozy loading */

  const observer = lozad(imgList);
  observer.observe();

  /* popup */

  $(`${IMG_SCOPE} p > img[data-src],${IMG_SCOPE} img[data-src].preview-img`).each(
    function() {
      let nextTag = $(this).next();
      const title = nextTag.prop('tagName') === 'EM' ? nextTag.text() : '';
      const src = $(this).attr('data-src'); // created by lozad.js

      $(this).wrap(`<a href="${src}" title="${title}" class="popup"></a>`);
    }
  );

  $('.popup').magnificPopup({
    type: 'image',
    closeOnContentClick: true,
    showCloseBtn: false,
    zoom: {
      enabled: true,
      duration: 300,
      easing: 'ease-in-out'
    }
  });


  /* markup the image links */
  $(`${IMG_SCOPE} a`).has("img").addClass('img-link');

});

