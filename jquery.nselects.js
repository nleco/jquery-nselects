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
		postInit : false,
		postOptionClick : false
	};

	var key_map = {
		tab : 9,
		enter : 13,
		up : 38,
		left: 37,
		right: 39,
		down: 40
	}

	var methods = {
		init : function(options) {
			var ret,
				bd = $('body');
			
			if (options) {
				$.extend(settings, options);
			}
			
			ret = this.each(function(index){
				var t = $(this),
					opts = $('option', t),
					nsel = $('<a href="javascript:;" class="nselects" style="height:'+t.height()+'px;width:'+t.width()+'px">'),
					nsel_text = $('<div>').addClass('nselects-text').attr('style', 'line-height:'+t.height()+'px'),
					nsel_icon = $('<div class="nselects-icon">'),
					nsel_menu = $('<div class="nselects-menu" style="display:none;position:absolute;min-width:'+t.width()+'px">');
				
				//Hide the original select -----------------------------------------------------
				t.hide();
				
				//transfer over some attributes ------------------------------------------------
				if (t.attr('id'))
					nsel.attr(t.attr('id')+'-nselects');
				
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
				
				if (t.attr('title'))
					nsel.attr(t.attr('title'));
				
				// do the manipulation/setting up of elements ----------------------------------
				// the initial text
				nsel_text.text($('option:selected', t).text());
				
				// set up the menu
				var nsel_menu_list = $('<ul class="nselects-menu-list">'),
					selected_index = t.attr('selectedIndex');
				opts.each(function(i){
					var t = $(this),
						list_item = $('<li class="nselects-menu-list-item"><a href="#" value="'+t.val()+'" class="nselects-menu-list-link"><div class="nselects-menu-list-wrap">'+t.text()+'</div></a></li>');
					
					if (i == selected_index)
						list_item.addClass('nselects-menu-list-item-selected')
						
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
				
				//user defined post init action
				if (typeof settings.postOptionClick === 'function')
					settings.postOptionClick(nsel, nsel_menu, t);
			});

			//set event 
			$('a.nselects').bind('click.nselects', function(e){
				methods.toggleMenu(e, $(this), false);
			});
			
			if (!bd.data('nselects-lives')) {
				//SELECT events	
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
				
				$('a.nselects').keydown(function(e){
					var t = $(this),
						org = t.data('nselects-org'),
						menu = t.data('nselects-menu');
					
					//todo: enter - if not open, open. else close if none is selected.
					
					switch(e.keyCode)
					{
						case key_map.enter:
							methods.toggleMenu(e, t, false);
							break;
							
						case key_map.tab:
							methods.hideAllMenus();
							break;
							
						case key_map.down:
						case key_map.right:
							methods.nextItem(t, menu, org);
							e.preventDefault();
							break;
							
						case key_map.up:
						case key_map.left:
							methods.prevItem(t, menu, org);
							e.preventDefault();
							break;
								
						default:
							String.fromCharCode(e.keyCode);
							e.preventDefault();
							break;
					}
					
				});
				
				//MENU events
				$('a.nselects-menu-list-link').live('click.nselects', function(e){
					var t = $(this),
						menu = t.parents('div.nselects-menu'),
						orig = menu.data('nselects-org'),
						nsel = menu.data('nselects'),
						li = t.parents('li.nselects-menu-list-item');
					
					$('.nselects-text', nsel).text(t.text());
					orig.val(t.attr('value'));
					$('.nselects-menu-list-item', menu).removeClass('nselects-menu-list-item-selected');
					li.addClass('nselects-menu-list-item-selected');
					
					e.preventDefault();
					
					//user defined post action
					if (typeof settings.postOptionClick === 'function')
						settings.postOptionClick(t, menu, nsel, orig);
				});
				
				//HIDE ON OUTSIDE CLICKS
				bd.live('click.nselects', methods.hideAllMenus);
				
				bd.data('nselects-lives', true);
			}
			
			return ret;
		},
		toggleMenu : function(e, link, index) { //e = event, t = link, index = s
			var org = link.data('nselects-org'),
				menu = link.data('nselects-menu');
				off = link.offset(),
				lis = $('li.nselects-menu-list-item', menu),
				selected_index = org.attr('selectedIndex');

			methods.hideAllMenus(menu, link);
			
			link.toggleClass('nselects-active');
			if (link.hasClass('nselects-active')) {
				menu.show();
				link.addClass('nselects-menu-open');
			} else {
				menu.hide();
				link.removeClass('nselects-menu-open');
			}					
			
			var top_sum = off.top;
			lis.each(function(i){
				if (i >= selected_index)
					return false;
					
				top_sum -= $(this).height();
				
				if (top_sum < 0) {
					top_sum = 0;
					return false;
				}
			});
			menu.css({top: top_sum+'px', left: off.left+'px'});
			
			link.addClass('nselects-focused');
			
			e.stopPropagation();
			e.preventDefault();
		},
		//Hide all except the passed in menu, if given
		hideAllMenus : function(menu, link) {
			//Hide the menus if visible
			var m = $('.nselects-menu'),
				s = $('.nselects');

			if (menu)
				m = m.not(menu);

			m.hide();

			if (link)
				s = s.not(link);
				
			s.removeClass('nselects-active');
			$('.nselects-focused', s).removeClass('nselects-focused');
		},
		nextItem : function(link, menu, org) {
			
		},
		prevItem : function() {
		
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