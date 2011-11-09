/*
 * nelects - jQuery plugin to change selects into customizable events
 *
 * Author: Samuel Sanchez <nleco@yahoo.com>
 *
 * Copyright (c) 2011 Samuel Sanchez
 *
 * Dual licensed under the MIT and GPL licenses:
 *   http://www.opensource.org/licenses/mit-license.php
 *   http://www.gnu.org/licenses/gpl.html
 *
 */
(function($) {
	var settings = {
			postInit : false, //fire off user defined fnc after init, passes in list
			postOptionClick : false, //fire off user defined fnc after clicking an option
			menuStyle : 'down', //what type of overlay to show: down, overlay
			extraWidth : 20, //little extra width to give to select link
			typingTime : false // if set to false, it will only use the first character
		},
		key_map = {
			tab : 9,
			enter : 13,
			esc : 27,
			up : 38,
			left: 37,
			right: 39,
			down: 40
		},
		typeSearch = {
			id : false,
			value : ''
		},
		methods = {
			init : function(options) {
				var ret,
					bd = $('body'),
					version = $().jquery.split('.');
			
				if (options) {
					$.extend(settings, options);
				}
				
				//requires 1.6 or higher
				if (version[0] == 1 && version[1] < 6) {
					alert('must be using jquery 1.6 or higher to use jquery-nselects');
					return this;
				}
				
				ret = this.each(function(index){
					var t = $(this),
						w = t.innerWidth()+settings.extraWidth,
						h = t.innerHeight(),
						opts = $('option', t),
						nsel = $('<a href="javascript:;" class="nselects" style="height:'+h+'px;width:'+w+'px">'),
						nsel_text = $('<div>').addClass('nselects-text'),
						nsel_icon = $('<div class="nselects-icon">'),
						nsel_menu = $('<div class="nselects-menu nselects-menu-style-'+settings.menuStyle+'" style="display:none;position:absolute;min-width:'+w+'px">');
				
					//Hide the original select -----------------------------------------------------
					t.hide();
				
					//transfer over some ids/classes/attributes ------------------------------------------------
					if (t.attr('id')) {
						nsel.attr(t.attr('id')+'-nselects');
					}
				
					if (t.attr('class')) {
						var s = t.attr('class').split('\s+'),
							sl = s.length;
						
						for (var i = 0; i < sl; i++) {
							nsel.addClass(s[i]);
						}
					}
				
					if (t.attr('tabindex')) {
						nsel.attr(t.attr('tabindex'));
						t.removeAttr('tabindex');
					}
				
					if (t.attr('title')) {
						nsel.attr(t.attr('title'));
					}
				
					// do the manipulation/setting up of elements ----------------------------------
					// the initial text
					nsel_text.text($('option:selected', t).text());
				
					// set up the menu
					var nsel_menu_list = $('<ul class="nselects-menu-list">'),
						selected_index = t.prop('selectedIndex');
					
					opts.each(function(i){
						var t = $(this),
							list_item = $('<li class="nselects-menu-list-item"><a href="#" value="'+i+'" class="nselects-menu-list-link"><div class="nselects-menu-list-wrap">'+t.text()+'</div></a></li>');
					
						if (i == selected_index) {
							list_item.addClass('nselects-menu-list-item-selected')
						}
						nsel_menu_list.append(list_item);
					});
					nsel_menu.append(nsel_menu_list);
					bd.append(nsel_menu);
					
					// save some data so we can reference it in handlers ---------------------------
					nsel.data({
						'nselects-org': t,
						'nselects-menu': nsel_menu
					});
				
					nsel_menu.data({
						'nselects-org': t,
						'nselects': nsel
					});
				
					// combine them and set them in the DOM ----------------------------------------
					nsel.append(nsel_text).append(nsel_icon);
					t.after(nsel);
				});

				//the mouse click that opens the select options
				// todo: figure out how to trigger this via 'live' and work with the the outside click closer
				//       that way we wont bind this on every select
				$('a.nselects').bind('click.nselects', function(e){
					e.stopPropagation();
					e.preventDefault();
					methods.toggleMenu(e, $(this), false);
					$(this).addClass();
				});

				//set event once			
				if (!bd.data('nselects-lives')) {
					//lets make sure this doesn't run again
					bd.data('nselects-lives', true);
				
					// key events when focused
					$('a.nselects').keydown(function(e){
						var t = $(this),
							org = t.data('nselects-org'),
							menu = t.data('nselects-menu'),
							searchChar = String.fromCharCode(e.keyCode);;
						
						//todo: enter - if not open, open. else close if none is selected.
						switch(e.keyCode) {
							case key_map.enter:
								methods.toggleMenu(e, t, false);
								break;
							
							case key_map.tab:
							case key_map.esc:
								methods.hideMenus();
								break;
							
							case key_map.down:
							case key_map.right:
								methods.traverseList(t, menu, org, 1);
								e.preventDefault();
								break;
							
							case key_map.up:
							case key_map.left:
								methods.traverseList(t, menu, org, -1);
								e.preventDefault();
								break;
							
							default:
								if (typeSearch.id) {
									clearTimeout(typeSearch.id);
								}
								
								//for now only simple chars
								searchChar = searchChar.replace(/[^ a-zA-z0-9]/g, '');
								
								if (settings.typingTime === false) {
									//cancel current timeout, if any
									if (typeSearch.id !== false) {
										cancelTimeout(typeSearch.id);
									}
									// add to the current one
									typeSearch.value = typeSearch.value + searchChar;
									//set new timeout
									typeSearch.id = setTimeout(function(){
										typeSearch.value = '';
										typeSearch.id = false;
										}, settings.typingTime);
								} else {
									typeSearch.value = searchChar;
								}
									
								methods.searchSelectItem(t, menu, org, typeSearch.value);
								e.preventDefault();
								break;
						}
					
					});
				
					//SELECT events	to trigger states
					$('a.nselects').live('focus.nselects', function(e){
						$(this).addClass('nselects-focused');
					});
				
					$('a.nselects').live('blur.nselects', function(e){
						$(this).removeClass('nselects-focused');
					});
				
					$('a.nselects').live('mouseover.nselects', function(e){
						$(this).addClass('nselects-mouseover');
					});
				
					$('a.nselects').live('mouseout.nselects', function(e){
						$(this).removeClass('nselects-mouseover');
					});
				
					//MENU events
					$('a.nselects-menu-list-link').live('click.nselects', function(e){
						e.preventDefault();
						
						var t = $(this),
							menu = t.parents('div.nselects-menu'),
							org = menu.data('nselects-org'),
							link = menu.data('nselects'),
							index = t.attr('value');
					
						methods.setValue(org, index);
						methods.setTitle(link, org, index);
						methods.setMenu(menu, index);

						//user defined post action
						if (typeof settings.postOptionClick === 'function')
							settings.postOptionClick(t, menu, nsel, orig);
					});
				
					//HIDE ON OUTSIDE CLICKS
					bd.live('click.nselects', function(e){
						e.preventDefault();
						methods.hideMenus();
					});
				}
			
				//user defined post init action
				if (typeof settings.postInit === 'function') {
					settings.postInit(ret);
				}
			
				return ret;
			},
			toggleMenu : function(e, link, index) {
				e.stopPropagation();
				e.preventDefault();
			
				var org = link.data('nselects-org'),
					menu = link.data('nselects-menu');
			
				link.toggleClass('nselects-active');
				if (link.hasClass('nselects-menu-open')) {
					methods.hideMenus();
				} else {
					methods.hideMenus(menu);
					methods.showMenu(link, menu, org);					
				}
				
				link.addClass('nselects-focused');
			},
			//Hide all except the passed in menu, if given
			hideMenus : function(menu) {
				//Hide the menus if visible
				var m = $('.nselects-menu'),
					s = $('.nselects');
				if (menu) {
					m = m.not(menu);
				}
				m.hide();
				
				s.removeClass('nselects-active nselects-menu-open');
				$('.nselects-focused', s).removeClass('nselects-focused');
			},
			//show the selected menu
			showMenu : function(link, menu, org) {
				var off = link.offset(),
					lis = $('li.nselects-menu-list-item', menu),
					selected_index = org.prop('selectedIndex'),
					top_sum = off.top,
					top_left = off.left
				
				if (link.hasClass('nselects-active')) {
					menu.hide();
					link.removeClass('nselects-menu-open');
				} else {
					menu.show();
					link.addClass('nselects-menu-open');
				}
				
				//how/where to show menu
				if (settings.menuStyle == 'down') { //show downwards
					top_sum += lis.first().innerHeight();
				} else { // 'overlay' is default
					lis.each(function(i){
						if (i >= selected_index)
							return false;
					
						top_sum -= inHeight;
				
						if (top_sum < 0) {
							top_sum = 0;
							return false;
						}
					});
				}
				menu.css({top: top_sum+'px', left: top_left+'px'});
			},
			// event for when you select the previous or next item via arrows
			traverseList : function(link, menu, org, step) {
				var currentIndex = org.prop('selectedIndex'),
					maxNumItems = org.find('option').length,
					nextIndex;
					
				nextIndex = currentIndex + step;
				
				if (nextIndex <= 0) {
					nextIndex = 0;
				} else if (nextIndex >= maxNumItems-1) {
					nextIndex = maxNumItems-1;
				} 
				
				if (nextIndex !== currentIndex) {
					methods.setTitle(link, org, nextIndex);
					methods.setMenu(menu, nextIndex);
					methods.setValue(org, nextIndex);
				}
			},
			// event for other keys pressed, mainly searching, while the menu item is open
			searchSelectItem : function(link, menu, org, searchText) {					
				var index = null,
					startIndex = org.prop('selectedIndex'),
					regex;
				
				//find value. start first from current selected index.
				menu.find('.nselects-menu-list-item:gt('+startIndex+')').each(function(i){
					regex = new RegExp('^'+searchText,'i');
					if (regex.test($(this).find('.nselects-menu-list-wrap').text())) {
						index = i+startIndex+1;
						return false;
					}				
				});
				
				//if still null, search from start
				if (index === null) {
					menu.find('.nselects-menu-list-item:lt('+startIndex+')').each(function(i){
						regex = new RegExp('^'+searchText,'i');
						if (regex.test($(this).find('.nselects-menu-list-wrap').text())) {
							index = i;
							return false;
						}				
					})
				}
				
				if (index !== null) {
					methods.setTitle(link, org, index);
					methods.setMenu(menu, index);
					methods.setValue(org, index);
				}
			},
			setTitle : function(link, org, index) {
				var opt = org.find('option:eq('+index+')');
				link.find('.nselects-text').text(opt.text());
			}, 
			setMenu : function(menu, index) {
				menu.find('.nselects-menu-list-item').removeClass('nselects-menu-list-item-selected');
				menu.find('.nselects-menu-list-item:eq('+index+')').addClass('nselects-menu-list-item-selected');
			},
			setValue : function(org, index) {
				org.prop('selectedIndex', index);
			}
		};

	$.fn.nselects = function(method) {
    	if (methods[method]) {
			return methods[method].apply(this, Array.prototype.slice.call( arguments, 1 ));
		} else if (typeof method === 'object' || ! method) {
			return methods.init.apply(this, arguments);
		}
	};
})(jQuery);