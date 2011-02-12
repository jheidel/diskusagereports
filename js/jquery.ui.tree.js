;(function($) {

$.widget("ui.tree", {
	options: {
		expandRoot: true,
		data: null,
		root: null,
		expandOnSelect: true,
		closeOthersOnSelect: true,
		comparator: function(a, b) {
			if (a.name.toLowerCase() < b.name.toLowerCase()) return -1;
			if (a.name.toLowerCase() > b.name.toLowerCase()) return 1;
			return 0;
		}
	},
	
	select: function(hash, li) {
		var self = this,
			parents = [];
		
		if ($.isArray(hash)) {
			parents = hash;
			hash = parents.pop();
		}
		
		if (!this._data[hash]) {
			this.deselect();
			return;
		}
		
		if (hash != this._lastHash) {
			this._lastHash = hash;
			
			for (var i = 0; i < parents.length; i++) {
				this.open(parents[i]);
			}
			
			if (!li) li = $('#' + this.widgetBaseClass + '_' + hash);
			
			$('li.selected', this.element).removeClass('selected');
			li.addClass('selected');
			
			if (this.options.closeOthersOnSelect) {
				$('li.' + this.widgetBaseClass + '-open').each(function(){
					if (!$(this).equals(li) && !li.isParentOf($(this)) && !li.isChildOf($(this))) {
						self.close(null, $(this));
					}
				});
			}
			
			if (this.options.expandOnSelect) this.open(hash, li);
		}
	},
	
	deselect: function() {
		$('li.selected', this.element).removeClass('selected');
		this._lastHash = null;
	},
	
	open: function(hash, li) {
		if (!li) li = $('#' + this.widgetBaseClass + '_' + hash);
		
		if ($('> ul', li).size() != 0) {
			li.addClass(this.widgetBaseClass + '-open');
			$('> ul', li).show();
		}
		else {
			li.addClass(this.widgetBaseClass + '-open');
			li.append(this._createUL(hash));
		}
	},
	
	close: function(hash, li) {
		if (!li) li = $('#' + this.widgetBaseClass + '_' + hash);
		
		if (!li.hasClass(this.widgetBaseClass + '-root')) {
			li.removeClass(this.widgetBaseClass + '-open');
			$('> ul', li).hide();
		}
	},
	
	toggle: function(hash, li) {
		if (!li) li = $('#' + this.widgetBaseClass + '_' + hash);
		
		if (li.hasClass(this.widgetBaseClass + '-open')) {
			this.close(hash, li);
		}
		else {
			this.open(hash, li);
		}
	},
	
	_create: function() {
		var self = this,
			$elem = $(this.element).disableTextSelection().addClass(this.widgetBaseClass);
		
		if (this.options.data == null || this.options.root == null) {
			throw "data and root must be specified in the options for ui.tree.";
		}
		
		this._lastHash = null;
		this._data = this.options.data;
		
		if ($.isUndefined(this._data[this.options.root])) {
			throw "root was not found in the provided directory data.";
		}
		
		$elem.click(function(eo) {
			var id, li, target = $(eo.target);
			
			if (target.closest('div.' + self.widgetBaseClass + '-expander').size() > 0) {
				li = target.closest('li');
				id = li.attr('id');
			}
			
			if (li && $.isString(id) && id.indexOf(self.widgetBaseClass + '_') == 0) {
				var hash = id.substring((self.widgetBaseClass + '_').length);
				
				if (target.hasClass(self.widgetBaseClass + '-expander')) {
					self.toggle(hash, li);
				}
				else {
					self.select(hash, li);
					self._trigger('selection', {}, [ hash ]);
				}
			}
		});
		
		$elem.append('<ul>' + this._createLI(this.options.root, this._data[this.options.root].name, this.widgetBaseClass + '-root ' + this.widgetBaseClass + '-open') + '</ul>');
		
		$('#' + this.widgetBaseClass + '_' + this.options.root).append(this._createUL(this.options.root));
	},
	
	_createUL: function(hash) {
		if (!this._data[hash]) return '';
		
		var li = [],
			self = this,
			subdirs = this._data[hash].subdirs;
		
		for (var i = 0; i < subdirs.length; i++) {
			
			var hash = $.isString(subdirs[i]) ? subdirs[i] : subdirs[i].hash;
			var data = this._data[hash];
			var html = this._createLI(hash, data.name, data.subdirs.length > 0 ? '' : this.widgetBaseClass + '-nosubdirs');
			
			var index = BinarySearch(li, data, function(needle, item, index) {
				return self.options.comparator(needle, item[0]);
			});
			
			if (index < 0) {
				li.splice(Math.abs(index)-1, 0, [data, html]);
			}
			else {
				li.splice(index, 0, [data, html]);
			}
		}
		
		var finalHTML = '';
		for (var i = 0; i < li.length; i++) {
			finalHTML += li[i][1];
		}
		
		return '<ul>' + finalHTML + '</ul>';
	},
	
	_createLI: function(hash, name, classes) {
		return '<li '+ ($.isString(classes) ? ' class="' + classes + '" ' : '') +' id="' + this.widgetBaseClass + '_' + hash.htmlencode() + '"><div class="' + this.widgetBaseClass + '-expander"><div class="' + this.widgetBaseClass + '-icon"><span>' + name.htmlencode() + '</span></div></div></li>';
	},
	
	resort: function() {
		var self = this, subUL,
			stack = [ $('>ul', this.element).get(0) ], ul;
		
		while ($.isDefined(ul = stack.pop())) {
			var sorted = [], original = $('>li', ul);
			
			$('>li', ul).each(function(){
				var hash = this.id.substr((self.widgetBaseClass + '_').length);
				var data = self._data[hash];
				
				if (subUL = $('>ul', this))
					stack.push(subUL);
				
				var index = BinarySearch(sorted, data, function(needle, item, index) {
					return self.options.comparator(needle, item[0]);
				});
				
				if (index < 0) {
					sorted.splice(Math.abs(index)-1, 0, [data, this]);
				}
				else {
					sorted.splice(index, 0, [data, this]);
				}
			});
			
			$(ul).append($($.map(sorted, function(item){ return item[1]; })));
		}
	}
});

})(jQuery);