var g_ppsWindowLoaded = false;
jQuery(document).ready(function(){
	if(typeof(ppsPopupsFromFooter) !== 'undefined' && ppsPopupsFromFooter && ppsPopupsFromFooter.length) {
		ppsPopups = typeof(ppsPopups) === 'undefined' ? [] : ppsPopups;
		ppsPopups = ppsPopups.concat( ppsPopupsFromFooter );
	}
	if(typeof(ppsPopups) !== 'undefined' && ppsPopups && ppsPopups.length) {
		ppsInitBgOverlay();
		jQuery(document).trigger('ppsBeforePopupsInit', ppsPopups);
		for(var i = 0; i < ppsPopups.length; i++) {
			jQuery('body').append( ppsPopups[ i ].rendered_html );
			ppsMovePopupStyles( ppsPopups[ i ] );	// Move back from replaced style tags - to normal style tag
			ppsBindPopupLove( ppsPopups[ i ] );
			ppsBindPopupLoad( ppsPopups[ i ] );
			ppsBindPopupShow( ppsPopups[ i ] );
			ppsBindPopupClose( ppsPopups[ i ] );
			ppsBindPopupActions( ppsPopups[ i ] );
			ppsBindPopupSubscribers( ppsPopups[ i ] );
			ppsBindPopupForceShow( ppsPopups[ i ] );
		}
		_ppsBindOnElementClickPopups();
		jQuery(document).trigger('ppsAfterPopupsInit', ppsPopups);
		jQuery(window).resize(function(){
			for(var i = 0; i < ppsPopups.length; i++) {
				if(ppsPopups[ i ].is_visible) {
					_ppsPositionPopup({popup: ppsPopups[ i ]});
				}
			}
		});
		// For case when for some reason jQuery(window).load() will not trigger - 
		// make it work correctly with re-position and re-sizing in any case
		setTimeout(function(){
			g_ppsWindowLoaded = true;
		}, 5000);
	}
});
jQuery(window).load(function(){
	g_ppsWindowLoaded = true;
	for(var i = 0; i < ppsPopups.length; i++) {
		if(ppsPopups[ i ].is_visible) {
			_ppsPositionPopup({popup: ppsPopups[ i ]});
		}
	}
});
function _ppsCheckPopupOnFollowClk( lnk ) {
	var href = lnk.href
	,	hash = lnk.hash
	,	wndLocation = window.location.href
	,	wndHash = window.location.hash;
	if(hash) {
		if(hash && hash != '') {
			href = str_replace(href, hash, '');
		}
		if(wndHash && wndHash != '') {
			wndLocation = str_replace(wndLocation, wndHash, '');
		}
		if(strpos(href, '/', href.length - 1) !== false) {
			href = href.substr(0, href.length - 1);
		}
		if(strpos(wndLocation, '/', wndLocation.length - 1) !== false) {
			wndLocation = wndLocation.substr(0, wndLocation.length - 1);
		}
		if(wndLocation == href) {
			setTimeout(function(){
				toeReload();
			}, 100);
		}
	}
}
function _ppsBindOnElementClickPopups() {
	var clickOnLinks = jQuery('[href*=#ppsShowPopUp_]');
	if(clickOnLinks && clickOnLinks.size()) {
		clickOnLinks.each(function(){
			jQuery(this).click(function(){
				var popupId = jQuery(this).attr('href');
				if(popupId && popupId != '') {
					popupId = popupId.split('_');
					popupId = popupId[1] ? parseInt(popupId[1]) : 0;
					if(popupId) {
						var popup = ppsGetPopupById( popupId );
						if(popup && popup.params.main.show_on == 'link_follow') {
							_ppsCheckPopupOnFollowClk( this );
							return true;
						}
						if(!_ppsPopupBindDelay(popupId, 'show_on_click_on_el_delay', 'show_on_click_on_el_enb_delay')) {
							ppsShowPopup( popupId );
						}
					} else {
						_ppsCheckPopupOnFollowClk( this );
						return true;
					}
				}
				return false;
			});
		});
	}
	var clickOnMenuItems = jQuery('[title*=#ppsShowPopUp_]');	// You can also set this in title - for menu items for example
	if(clickOnMenuItems && clickOnMenuItems.size()) {
		clickOnMenuItems.each(function(){
			var title = jQuery(this).attr('title')
			,	matched = title.match(/#ppsShowPopUp_(\d+)/);
			if(matched && matched.length == 2) {
				var popupId = parseInt(matched[1]);
				if(popupId) {
					jQuery(this)
					.data('popup-id', popupId)
					.attr('title', str_replace(title, matched[0], ''))
					.click(function(){
						var popupId = jQuery(this).data('popup-id');
						if(!_ppsPopupBindDelay(popupId, 'show_on_click_on_el_delay', 'show_on_click_on_el_enb_delay')) {
							ppsShowPopup( popupId );
						}
						return false;
					});
				}
			}
		});
	}
}
function ppsMovePopupStyles( popup ) {
	var $style = jQuery('<style type="text/css" />')
	,	$replacerTag = jQuery('#ppsPopupStylesHidden_'+ popup.view_id);
	$style.appendTo('body').html( $replacerTag.html() );
	$replacerTag.remove();
}
function ppsBindPopupLove( popup ) {
	if(parseInt(toeOptionPps('add_love_link'))) {
		var $shell = ppsGetPopupShell( popup );
		$shell.append( toeOptionPps('love_link_html') );
	}
}
function ppsBindPopupLoad( popup ) {
	var preloadImgs = jQuery('.ppsPopupPreloadImg_'+ popup.view_id);
	popup._imgsCount = preloadImgs.size();
	if(popup._imgsCount) {
		popup._imgsLoaded = false;
		popup._imgsLoadedCount = 0;
		preloadImgs.bind('load error', function(){
			popup._imgsLoadedCount++;
			if(popup._imgsLoadedCount >= popup._imgsCount) {
				popup._imgsLoaded = true;
				var $shell = ppsGetPopupShell( popup );
				$shell.trigger('ppsShowPopupAfterAllImgs', popup);
			}
		});
	} else {
		if(toeInArrayPps(popup.type, ['iframe', 'pdf'])) {
			popup._imgsLoaded = false;
			var $shell = ppsGetPopupShell( popup );
			$shell.find('.ppsMainFrame').bind('load error', function(){
				var wasTriggeredBefore = popup._imgsLoaded;
				popup._imgsLoaded = true;
				if(!wasTriggeredBefore) {
					setTimeout(function(){
						$shell.trigger('ppsShowPopupAfterAllImgs', popup);
					}, 1000);	// This timeout need to be here - to wait until loaded frame will be correctly rendered
				}
			});
		} else {
			popup._imgsLoaded = true;
		}
	}
}
function ppsBindPopupShow( popup ) {
	_ppsCheckBindVideo({popup: popup});
	switch(popup.params.main.show_on) {
		case 'page_load':
			if(!_ppsPopupBindDelay(popup, 'show_on_page_load_delay', 'show_on_page_load_enb_delay')) {
				if(popup.type == 'fb_like') {	// FB Like will be rendered right after all widget content - will be loaded
					popup.render_with_fb_load = true;
				} else {
					ppsCheckShowPopup( popup );
				}
			}
			break;
		case 'click_on_page':
			jQuery(document).click(function(){
				if(!popup.click_on_page_displayed) {
					ppsCheckShowPopup( popup );
					popup.click_on_page_displayed = true;
				}
			});
			break;
		case 'click_on_element':
			// @see _ppsBindOnElementClickPopups()
			break;
		case 'scroll_window':
			jQuery(window).scroll(function(){
				if(parseInt(popup.params.main.show_on_scroll_window_enb_perc_scroll)) {
					var percScroll = parseInt( popup.params.main.show_on_scroll_window_perc_scroll );
					if(percScroll) {
						var docHt = jQuery(document).height()
						,	wndHt = jQuery(window).height()
						,	wndScrollPos = jQuery(window).scrollTop()
						,	wndScrollHt = docHt - wndHt
						,	currScrollPerc = wndScrollPos * 100 / wndScrollHt;
						if(wndScrollHt > 0 && currScrollPerc < percScroll) {
							return;
						}
					}
				}
				if(!popup.scroll_window_displayed) {
					var delay = 0;
					if(popup.params.main.show_on_scroll_window_enb_delay && parseInt(popup.params.main.show_on_scroll_window_enb_delay)) {
						popup.params.main.show_on_scroll_window_delay = parseInt( popup.params.main.show_on_scroll_window_delay );
						if(popup.params.main.show_on_scroll_window_delay) {
							delay = popup.params.main.show_on_scroll_window_delay * 1000;
						}
					}
					if(delay) {
						setTimeout(function(){
							ppsCheckShowPopup( popup );
						}, delay);
					} else {
						ppsCheckShowPopup( popup );
					}
					popup.scroll_window_displayed = true;
				}
			});
			break;
	}
}
function ppsBindPopupClose( popup ) {
	// For now - only one method - click on close btn
	var $shell = ppsGetPopupShell( popup );
	$shell.find('.ppsPopupClose').click(function(){
		ppsClosePopup( popup );
		return false;
	});
}
function ppsBindPopupSubscribers(popup) {
	if(popup.params.tpl.enb_subscribe) {
		var shell = ppsGetPopupShell( popup );
		switch(popup.params.tpl.sub_dest) {
			case 'aweber':
				// No ajax action here
			break;
			case 'wordpress': case 'mailchimp': case 'mailpoet': default:
				shell.find('.ppsSubscribeForm').submit(function(){
					var submitBtn = jQuery(this).find('input[type=submit]')
					,	self = this
					,	msgEl = jQuery(this).find('.ppsSubMsg');
					submitBtn.attr('disabled', 'disabled');
					jQuery(this).sendFormPps({
						msgElID: msgEl
					,	onSuccess: function(res){
							jQuery(self).find('input[type=submit]').removeAttr('disabled');
							if(!res.error) {
								var parentShell = jQuery(self).parents('.ppsSubscribeShell')
								,	closeInsideBtn = jQuery(self).find('.ppsPopupClose');	// Close button can be inside form - we can't remove it, because in this case user will not be able to close PopUp
								if(closeInsideBtn && closeInsideBtn.size()) {
									closeInsideBtn.appendTo( parentShell );
								}
								msgEl.appendTo( parentShell );
								jQuery(self).animateRemovePps( 300 );
								ppsPopupSubscribeSuccess( popup );
								if(res.data && res.data.redirect) {
									toeRedirect(res.data.redirect, parseInt(popup.params.tpl.sub_redirect_new_wnd));
								}
							} else {
								if(res.data && res.data.emailExistsRedirect) {
									toeRedirect( res.data.emailExistsRedirect );
								}
							}
						}
					});
					return false;
				});
				break;
		}
		// Required fields validation for Safary browser
		if(navigator.userAgent.indexOf('Safari') > -1 && !(navigator.userAgent.indexOf('Chrome') > -1)) {
			var forms = shell.get(0).getElementsByTagName('form');
			if(forms && forms.length) {
				for (var i = 0; i < forms.length; i++) {
					forms[i].noValidate = true;
					forms[i].addEventListener('submit', function(event) {
						if (!event.target.checkValidity()) {
							event.preventDefault();
							jQuery(this).find('.ppsSubMsg').addClass('ppsErrorMsg').html('Please fill-in all fields');
						}
					}, false);
				}
			}
		}
	}
}
/**
 * Will check - was popup shown before and it's setting, and deside - should it be shown now or not
 * @param {mixed} popup Popup object or it's ID
 */
function ppsCheckShowPopup( popup, params ) {
	if(jQuery.isNumeric( popup ))
		popup = ppsGetPopupById( popup );
	var showKey = 'pps_show_'+ popup.id
	,	prevShow = getCookiePps( showKey );
	if(popup.params.main.show_to == 'first_time_visit' && prevShow)
		return;
	if(!prevShow) {
		var saveCookieTime = parseInt(popup.params.main.show_to_first_time_visit_days);
		saveCookieTime = isNaN(saveCookieTime) ? 30 : saveCookieTime;
		if(!saveCookieTime)
			saveCookieTime = null;	// Save for current session only
		setCookiePps('pps_show_'+ popup.id, '1', saveCookieTime);	// Save just flag only in cookie for now
	}
	var actionDone = _ppsPopupGetActionDone( popup );
	if(popup.params.main.show_to == 'until_make_action' && actionDone)
		return;
	if(_ppsCheckDisplayTime( popup ))
		return;
	params = params || {};
	params.isUnique = prevShow ? 0 : 1;
	ppsShowPopup(popup, params);
	return false;
}
/**
 * Check popup show time - "Time display settings" in admin area
 * @param {mixed} popup Popup object or it's ID
 */
function _ppsCheckDisplayTime( popup ) {
	if(jQuery.isNumeric( popup ))
		popup = ppsGetPopupById( popup );
	if(popup.params.main.enb_show_time
		&& popup.params.main.show_time_from
		&& popup.params.main.show_time_to
		&& popup.params.main.show_time_from != popup.params.main.show_time_to
	) {
		var timeToNum = function(timeStr) {
			var add = strpos(timeStr, 'pm') !== false ? 12 : 0;
			var time = parseFloat(str_replace(str_replace(str_replace(timeStr, 'am', ''), 'pm', ''), ':', '.'));
			if(toeInArray(time, [12, 12.3]) === -1) {
				time += add;
			} else if(!add) {
				time -= 12;
			}
			return time;
		};
		var timeFrom = timeToNum(popup.params.main.show_time_from)
		,	timeTo = timeToNum(popup.params.main.show_time_to)
		,	currDate = new Date()
		,	currTime = currDate.getHours() + (currDate.getMinutes() / 100);
		
		if(currTime < timeFrom || currTime > timeTo) {
			return true;
		}
	}
	return false;
}
/**
 * Check - was action done in this popup or not (any action will be checked)
 * @param {mixed} popup Popup object or it's ID
 */
function _ppsPopupGetActionDone( popup ) {
	if(jQuery.isNumeric( popup ))
		popup = ppsGetPopupById( popup );
	var actionsKey = 'pps_actions_'+ popup.id
	,	actions = getCookiePps( actionsKey );
	if(actions) {
		// TODO: make priority check here - if subscribe enabled and user just shared popup - return false
		return true;
	}
	return false;
}
/**
 * Set done action in popup
 * @param {mixed} popup Popup object or it's ID
 * @param {type} action Action that was done
 */
function _ppsPopupSetActionDone( popup, action, smType ) {
	if(jQuery.isNumeric( popup ))
		popup = ppsGetPopupById( popup );
	smType = smType ? smType : '';
	var actionsKey = 'pps_actions_'+ popup.id
	,	actions = getCookiePps( actionsKey );
	if(!actions)
		actions = {};
	actions[ action ] = 1;	// Save only flags for now
	var saveCookieTime = parseInt(popup.params.main.show_to_until_make_action_days);
	saveCookieTime = isNaN(saveCookieTime) ? 30 : saveCookieTime;
	if(!saveCookieTime)
		saveCookieTime = null;	// Save for current session only
	setCookiePps(actionsKey, actions, saveCookieTime);
	_ppsPopupAddStat( popup, action, smType );
	jQuery(document).trigger('ppsAfterPopupsActionDone', {popup: popup, action: action, smType: smType});
}
function _ppsPopupAddStat( popup, action, smType, isUnique ) {
	jQuery.sendFormPps({
		msgElID: 'noMessages'
	,	data: {mod: 'statistics', action: 'add', id: popup.id, type: action, sm_type: smType, is_unique: isUnique, 'connect_hash': popup.connect_hash}
	});
}

/**
 * Show popup
 * @param {mixed} popup Popup object or it's ID
 * @param {objext} params Additional parameters to display
 */
function ppsShowPopup( popup, params ) {
	if(!ppsCorrectJqueryUsed()) {
		ppsReloadCoreJs(ppsShowPopup, [popup, params]);
		return;
	}
	params = params || {};
	if(jQuery.isNumeric( popup ))
		popup = ppsGetPopupById( popup );
	var shell = ppsGetPopupShell( popup );
	if(!popup._imgsLoaded) {
		shell.bind('ppsShowPopupAfterAllImgs', function(){
			ppsShowPopup( popup, params );
		});
		return;
	}
	_ppsPopupAddStat( popup, 'show', 0, params.isUnique );	// Save show popup statistics
	if(!params.ignoreBgOverlay) {
		ppsShowBgOverlay( popup );
	}
	if(g_ppsWindowLoaded && !params.ignorePosition) {
		_ppsPositionPopup({shell: shell, popup: popup});
	}
	if(popup.params.tpl.anim && !popup.resized_for_wnd) {
		_ppsHandlePopupAnimationShow( popup, shell );
	} else {
		shell.show();
	}
	_ppsCheckPlayVideo({popup: popup, shell: shell});
	_ppsIframesForReload({popup: popup, shell: shell});
	// timeout is to make sure that fronted.gmap.js loaded for this time - because exactly there we have defined maps data
	setTimeout(function(){
		_ppsCheckMap({popup: popup, shell: shell});
		_ppsSocialIcons({popup: popup, shell: shell});
	}, 100);
	// Check disable wnd scrolling
	if(popup.params.tpl.dsbl_wnd_scroll) {
		jQuery('html')
			.data('prev-overflow', jQuery('html').css('overflow'))	// Save prev overflow param - to restore it after PopUp close
			.css('overflow', 'hidden');
	}
	popup.is_visible = true;
	popup.is_rendered = true;	// Rendered at least one time
	jQuery(document).trigger('ppsAfterPopupsActionShow', popup);
}
function _ppsHandlePopupAnimationShow( popup, shell ) {
	var preAnimClass = popup.params.tpl.anim.old ? 'magictime' : 'animated';
	shell.animationDuration( popup.params.tpl.anim_duration, true );
	shell.removeClass(popup.params.tpl.anim.hide_class);
	shell.addClass(preAnimClass+ ' '+ popup.params.tpl.anim.show_class).show();
	// This need to make properly work responsivness
	setTimeout(function(){
		shell.removeClass(preAnimClass+ ' '+ popup.params.tpl.anim.show_class);
	}, parseInt(popup.params.tpl.anim_duration));
}
function _ppsHandlePopupAnimationHide( popup, shell ) {
	var preAnimClass = popup.params.tpl.anim.old ? 'magictime' : 'animated';
	shell.removeClass(popup.params.tpl.anim.show_class).addClass(popup.params.tpl.anim.hide_class);
	setTimeout(function(){
		shell.removeClass( preAnimClass ).hide();
		ppsHideBgOverlay( popup );
	}, popup.params.tpl.anim_duration );
}
function _ppsIframesForReload(params) {
	var popup = params.popup
	,	shell = params.shell ? params.shell : ppsGetPopupShell( popup );
	if(shell.find('iframe')) {
		shell.find('iframe').each(function(){
			var src = jQuery(this).attr('src');
			if(src.indexOf('www.google.com/maps/embed')) {
				this.src = this.src;	// Reoad iframe
			}
		});
	}
}
function _ppsCheckBindVideo(params) {
	params = params || {};
	if(params.popup.type == 'video') {
		var shell = params.shell ? params.shell : ppsGetPopupShell( params.popup );
		if(shell.find('iframe').size()) {
			shell.find('iframe').each(function(){
				jQuery(this).data('original-src', jQuery(this).attr('src'));
				jQuery(this).attr('src', '');
			});
		}
	}
}
function _ppsCheckPlayVideo(params) {
	params = params || {};
	if(params.popup.type == 'video') {
		var shell = params.shell ? params.shell : ppsGetPopupShell( params.popup );
		if(shell.find('iframe').size()) {
			shell.find('iframe').each(function(){
				var originalSrc = jQuery(this).data('original-src')
				,	src = jQuery(this).attr('src');
				if(originalSrc && originalSrc != '' && (!src || src == '')) {
					jQuery(this).attr('src', originalSrc);
				}
			});
		}
	}
}
function _ppsCheckStopVideo(params) {
	params = params || {};
	if(params.popup.type == 'video') {
		var shell = params.shell ? params.shell : ppsGetPopupShell( params.popup );
		if(shell.find('iframe').size()) {
			shell.find('iframe').each(function(){
				jQuery(this).attr('src', '');
			});
		}
	}
}
function _ppsCheckMap(params) {
	// For case we need to wait until gmap scripts will be loaded
	if(typeof(gmpGetMapByViewId) === 'undefined') {
		setTimeout(function(){
			_ppsCheckMap(params);
		}, 1000);
		return;
	}
	params = params || {};
	var shell = params.shell ? params.shell : ppsGetPopupShell( params.popup );
	if(shell.find('.gmp_map_opts').size()) {
		shell.find('.gmp_map_opts').each(function(){
			var viewId = shell.find('.gmp_map_opts').data('view-id')
			,	map = gmpGetMapByViewId(viewId);
			if(map) {	// If map is already there - just refresh it after popup was shown
				map.refresh();
			} else {	// If there are no map - but it should be there - just create it
				var mapId = shell.find('.gmp_map_opts').data('view-id')
				,	mapData = gmpGetMapInfoByViewId(mapId);
				gmpInitMapOnPage( mapData );
			}
		});
	}
}
/**
 * Check social icons from Social Share Buttons by Supsystic plugin
 * @param {object} params contain popup and popup shell html objects
 */
function _ppsSocialIcons(params) {
	params = params || {};
	var shell = params.shell ? params.shell : ppsGetPopupShell( params.popup )
	,	icons = shell.find('.supsystic-social-sharing:not(.supsystic-social-sharing-loaded)');
	if(icons && icons.size() && typeof(window.initSupsysticSocialSharing) !== 'undefined') {
		icons.each(function(){
			window.initSupsysticSocialSharing(this);
		});
	}
}
function _ppsSendVideoCommand(shell, command) {
	/*var executeClb = function(iframe) {
		jQuery(iframe).get(0).contentWindow.postMessage('{"event":"command","func":"'+ command+ '","args":""}', '*');
	};
	shell.find('iframe').each(function(){
		var src = jQuery(this).attr('src');
		//if(src.indexOf('youtube.com')) {
			if(jQuery(this).data('loaded')) {
				executeClb(this);
			} else {
				jQuery(this).load(function(){
					var self = this;
					setTimeout(function(){
						executeClb(self);
						jQuery(self).data('loaded', 'loaded');
					}, 100);
				});
			}
		//}
	});*/
		}
function _ppsPositionPopup( params ) {
	params = params || {};
	var shell = params.shell ? params.shell : ppsGetPopupShell( params.popup );
	if(shell) {
		var wndWidth = params.wndWidth ? params.wndWidth : jQuery(window).width()
		,	wndHeight = params.wndHeight ? params.wndHeight : jQuery(window).height()
		,	shellWidth = shell.outerWidth()
		,	shellHeight = shell.outerHeight()
		,	resized = false
		,	resizedW = false
		,	resizedH = false
		,	compareWidth = wndWidth - 10	// less then 10px
		,	compareHeight = wndHeight - 10	// less then 10px
		,	resizeDivision = 1
		,	responsiveInside = shell.hasClass('ppsResponsiveInside');
		
		if(shellHeight >= compareHeight && !responsiveInside && !(params.popup && params.popup._notResizeHeight)) {
			var initialHeight = parseInt(shell.data('init-height'));
			if(!initialHeight) {
				initialHeight = shellHeight;
				shell.data('init-height', initialHeight);
			}
			resizeDivision = compareHeight / initialHeight;
			resized = resizedH = true;
		}
		if(shellWidth >= compareWidth && !responsiveInside) {
			var initialWidth = parseInt(shell.data('init-width'));
			if(!initialWidth) {
				initialWidth = shellWidth;
				shell.data('init-width', initialWidth);
			}
			var widthDivision = compareWidth / initialWidth;
			if(widthDivision < resizeDivision) {
				resizeDivision = widthDivision;
			}
			resized = resizedW = true;
		}
		if(resized) {
			if(params.popup.params.tpl.responsive_mode == 'width_only') {
				if(resizedW) {
					var totalPadding = shellWidth - shell.width();	// outer width - just width == paddings
					shell.css({
						'width': 'calc(100% - '+ (totalPadding + 20)+ 'px)'
					});
				} else {
					var initialWidth = parseInt(shell.data('init-width'));
					if(initialWidth && initialWidth < compareWidth) {
						shell.css({
							'width': initialWidth
						});
					}
				}
				if(resizedH) {
					shell.css({
						'position': 'absolute'
					});
				} else {
					shell.css({
						'position': 'fixed'
					});
				}
			} else {
				var zoomOrigin = {left: 'center', top: 'center'};
				shell.zoom( resizeDivision, zoomOrigin.left+ ' '+ zoomOrigin.top );
			}
			shell.data('resized', 1);
			shellWidth = shell.outerWidth();
			shellHeight = shell.outerHeight();
		} else if(shell.data('resized')) {
			if(params.popup.params.tpl.responsive_mode == 'width_only') {
				var initialWidth = parseInt(shell.data('init-width'));
				if(initialWidth && initialWidth < compareWidth) {
					shell.css({
						'width': initialWidth
					});
				}
				shell.css({
					'position': 'fixed'
				});
			}
		}
		params.popup.resized_for_wnd = resized;
		jQuery(document).trigger('ppsResize', {popup: params.popup, shell: shell, wndWidth: wndWidth, wndHeight: wndHeight});
		if(!shell.positioned_outside) {	// Make available - re-position popup from outside modules
			var left = (wndWidth - shellWidth) / 2
			,	top = (wndHeight - shellHeight) / 2;
			left = left < 0 ? 0 : left;
			top = top < 0 ? 0 : top;
			if(resizedW) {
				left -= (initialWidth - initialWidth * widthDivision) / 2;
			}
			if(resizedH) {
				top -= (initialHeight - initialHeight * resizeDivision) / 2;
			}
			
			shell.css({
				'left': left
			,	'top': top
			});
		}
	} else {
		console.log('CAN NOT FIND POPUP SHELL TO RESIZE!');
	}
}
function ppsClosePopup(popup) {
	if(jQuery.isNumeric( popup ))
		popup = ppsGetPopupById( popup );
	var shell = ppsGetPopupShell( popup );
	if(popup.params.tpl.anim) {
		_ppsHandlePopupAnimationHide( popup, shell );
	} else {
		shell.hide();
		ppsHideBgOverlay( popup );
	}
	_ppsCheckStopVideo({shell: shell, popup: popup});
	// Check disable wnd scrolling
	if(popup.params.tpl.dsbl_wnd_scroll) {
		var prevOverflow = jQuery('html').data('prev-overflow');
		if(!prevOverflow || prevOverflow == '') {
			prevOverflow = 'visible';
		}
		jQuery('html').css('overflow', prevOverflow);
	}
	popup.is_visible = false;
}
function ppsGetPopupShell(popup) {
	if(jQuery.isNumeric( popup ))
		popup = ppsGetPopupById( popup );
	return jQuery('#ppsPopupShell_'+ popup.view_id);;
}
function ppsGetPopupById( id ) {
	for(var i = 0; i < ppsPopups.length; i++) {
		if(ppsPopups[ i ].id == id)
			return ppsPopups[ i ];
	}
	return false;
}
function ppsInitBgOverlay() {
	jQuery('body').append('<div id="ppsPopupBgOverlay" />');
	jQuery('#ppsPopupBgOverlay').click(function(){
		if(ppsPopups && ppsPopups.length) {
			for(var i = 0; i < ppsPopups.length; i++) {
				if(ppsPopups[ i ] 
					&& ppsPopups[ i ].params 
					&& ppsPopups[ i ].params.main
					&& ppsPopups[ i ].params.main.close_on
					&& ppsPopups[ i ].params.main.close_on == 'overlay_click'
				) {
					ppsClosePopup( ppsPopups[ i ] );
				}
			}
		}
	});
}
function ppsShowBgOverlay(popup) {
	if(popup && jQuery.isNumeric( popup ))
		popup = ppsGetPopupById( popup );
	if(popup.ignore_background)	// For some types - we will not be require background - so we can manipulate it using this key
		return;
	if(popup && typeof(popup.params.tpl.bg_overlay_opacity) !== 'undefined') {
		if(!popup.params.tpl.bg_overlay_opacity || popup.params.tpl.bg_overlay_opacity == '')
			popup.params.tpl.bg_overlay_opacity = 0;
		var opacity = parseFloat( popup.params.tpl.bg_overlay_opacity );
		if(!isNaN(opacity)) {
			jQuery('#ppsPopupBgOverlay').css({
				'opacity': opacity
			});
		}
	}
	jQuery('#ppsPopupBgOverlay').show();
}
function ppsHideBgOverlay(popup) {
	if(popup && jQuery.isNumeric( popup ))
		popup = ppsGetPopupById( popup );
	if(popup.ignore_background)	// For some types - we will not be require background - so we can manipulate it using this key
		return;
	jQuery('#ppsPopupBgOverlay').hide();
}
function ppsBindPopupActions(popup) {
	var shell = ppsGetPopupShell( popup );
	// TODO: make usage of ppsPopupSubscribeSuccess() function only after success subscribe process, not after subscribe action
	if(shell.find('.ppsSubscribeForm_aweber').size()) {
		shell.find('.ppsSubscribeForm_aweber').submit(function(){
			if(jQuery(this).find('input[name=email]').val()) {
				ppsPopupSubscribeSuccess( popup );
			}
		});
	}
	// Check build-in PopUp subscribe links
	if(shell.find('.ppsSmLink').size()) {
		shell.find('.ppsSmLink').click(function(){
			_ppsPopupSetActionDone(popup, 'share', jQuery(this).data('type'));
		});
	}
	// Check Social Share by Supsystic plugin links in PopUp
	if(shell.find('.supsystic-social-sharing').size()) {
		shell.find('.supsystic-social-sharing a').click(function(){
			var socHost = this.hostname
			,	socType = '';	// Social network type key
			if(socHost && socHost != '') {
				switch(socHost) {
					case 'www.facebook.com': 
						socType = 'facebook'; 
						break;
					case 'plus.google.com':
						socType = 'googleplus'; 
						break;
					case 'twitter.com':
						socType = 'twitter'; 
						break;
					default:
						socType = socHost;
						break;
				}
				_ppsPopupSetActionDone(popup, 'share', socType);
			}
		});
	}
	if(shell.find('.fb-like-box').size()) {
		_ppsBindFbLikeBtnAction(popup);
	}
}
function _ppsBindFbLikeBtnAction(popup) {
	if(typeof(FB) === 'undefined') {
		// recurse until FB core will not be loaded
		setTimeout(function(){
			_ppsBindFbLikeBtnAction(popup);
		}, 500);
		return;
	}
	FB.Event.subscribe('edge.create', function(response) {
		_ppsPopupSetActionDone(popup, 'fb_like');
	});
	FB.Event.subscribe('xfbml.render', function(response) {
		if(popup.render_with_fb_load) {	// If it need to be rendered
			ppsCheckShowPopup( popup );
		} else {	// else - just re-position it
			_ppsPositionPopup({popup: popup});
		}
	});
}
function ppsPopupSubscribeSuccess(popup) {
	if(popup && jQuery.isNumeric( popup ))
		popup = ppsGetPopupById( popup );
	_ppsPopupSetActionDone(popup, 'subscribe');
}
function _ppsPopupBindDelay(popup, delayKey, delayEnbKey) {
	if(popup && jQuery.isNumeric( popup ))
		popup = ppsGetPopupById( popup );
	var delay = (popup.params.main[ delayEnbKey ] 
			&& parseInt(popup.params.main[ delayEnbKey ])
			&& parseInt( popup.params.main[ delayKey ] ))
		? (parseInt(popup.params.main[ delayKey ]) * 1000)
		: 0;
	if(delay) {
		setTimeout(function(){
			ppsCheckShowPopup( popup );
		}, delay);
		return true;
	}
	return false;
}
/**
 * Check show PopUp right after page was loaded
 * @param {object} popup PopUp object
 */
function ppsBindPopupForceShow( popup ) {
	if(popup.params.main.show_on != 'link_follow') {
		var hashParams = toeGetHashParams();
		if(hashParams && hashParams.length && toeInArray('ppsShowPopUp_'+ popup.id, hashParams) !== -1) {
			ppsCheckShowPopup( popup );
		}
	}
} 