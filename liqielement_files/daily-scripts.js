/**
 * navigation.js
 *
 * Handles toggling the navigation menu for small screens.
 */
( function() {
	var container, button, menu;

	container = document.getElementById( 'site-navigation' );
	if ( ! container )
		return;

	button = container.getElementsByTagName( 'button' )[0];
	if ( 'undefined' === typeof button )
		return;

	menu = container.getElementsByTagName( 'ul' )[0];

	// Hide menu toggle button if menu is empty and return early.
	if ( 'undefined' === typeof menu ) {
		button.style.display = 'none';
		return;
	}

	if ( -1 === menu.className.indexOf( 'nav-menu' ) )
		menu.className += ' nav-menu';

	button.onclick = function() {
		if ( -1 !== container.className.indexOf( 'toggled' ) )
			container.className = container.className.replace( ' toggled', '' );
		else
			container.className += ' toggled';
	};
} )();

( function() {
	var is_webkit = navigator.userAgent.toLowerCase().indexOf( 'webkit' ) > -1,
	    is_opera  = navigator.userAgent.toLowerCase().indexOf( 'opera' )  > -1,
	    is_ie     = navigator.userAgent.toLowerCase().indexOf( 'msie' )   > -1;

	if ( ( is_webkit || is_opera || is_ie ) && document.getElementById && window.addEventListener ) {
		window.addEventListener( 'hashchange', function() {
			var element = document.getElementById( location.hash.substring( 1 ) );

			if ( element ) {
				if ( ! /^(?:a|select|input|button|textarea)$/i.test( element.tagName ) )
					element.tabIndex = -1;

				element.focus();
			}
		}, false );
	}
})();

jQuery(document).ready(function() {
	$('.home .point-1').waypoint(function(direction) {
       if (direction === 'down') {
         $('.site-header').toggleClass('fixme');
         $('.site-header').css('bottom','auto');
     //  $('.site-header').css('height','70px');
         $('.home-intro').css('display','none');
       }
       else {
         $('.site-header').removeClass('fixme');
		 $('.site-header').css('bottom','0');
	 //  $('.site-header').css('height','100px');
		 $('.home-intro').css('display','table');
       }
    });



	$('.single .post-navigation').waypoint(function(direction) {

		if (direction === 'down') {
         $('.single .nav-links').toggleClass('nav-links-stop');

       }
       else {
         $('.single .nav-links').removeClass('nav-links-stop');
       }

       }, { offset: 'bottom-in-view'

    });






$(window).resize(function(){

   var width = $(window).width();
   if(width  <= 767){
       $('body').addClass('mobile');
   }
   else{
       $('body').removeClass('mobile');
   }
})
.resize();//trigger the resize event on page load.





	//Scroll down when button is clicked


	$('.scroll-down').click(function() {
	    $('html, body').animate({
	        scrollTop: $('.point-1').offset().top
	    }, 500);
	});










// Show or hide the sticky footer button
               jQuery(window).scroll(function() {
                    if (jQuery(this).scrollTop() > 400) {
                         jQuery('.single .nav-links').fadeIn(300);
                    } else {
                         jQuery('.single .nav-links').fadeOut(300);
                    }
               });




          //      $('a.img').magnificPopup({type:'image'});

          $('.single-post .entry-content').magnificPopup({
  delegate: 'a.img', // child items selector, by clicking on it popup will open
  type: 'image',
  // other options
  gallery: {
	  enabled: true
  }
});


});







