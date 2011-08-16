/*

    jQuery Tags Input Plugin 1.3.1

    Copyright (c) 2011 XOXCO, Inc

    Documentation for this plugin lives here:
    http://xoxco.com/clickable/jquery-tags-input

    Licensed under the MIT license:
    http://www.opensource.org/licenses/mit-license.php

    ben@xoxco.com

*/

(function ($) {

    var delimiter = new Array();

    $.fn.addTag = function (value, options) {
        var options = $.extend({
            focus: false,
            callback: true
        }, options);

        value = $.trim(value);

        this.each(function () {
            var id = $(this).attr('id');

            var tagslist = $(this).val().split(delimiter[id]);
            if (tagslist[0] == '') {
                tagslist = new Array();
            }

            var skipTag = options.unique ? $(tagslist).tagExist(value) : false;
            if (value == '' || skipTag) {
                return true;
            }

            $('<span>').addClass('tag').append(
                $('<span>').text(value).append('&nbsp;&nbsp;'),
                $('<a>', {
                    href  : '#',
                    title : 'Removing tag',
                    text  : 'x'
                }).click(function () {
                    return $('#' + id).removeTag(escape(value));
                })
            ).insertBefore('#' + id + '_addTag');

            tagslist.push(value);

            $('#' + id + '_tag').val('');
            if (options.focus) {
                $('#' + id + '_tag').focus();
            }
            else {
                $('#' + id + '_tag').blur();
            }

            if (options.callback) {
                $(this).trigger('addTag', [value]);
            }
            $(this).trigger('changeTag', [value]);
            $.fn.tagsInput.updateTagsField(this, tagslist);
        });

        return false;
    };

    $.fn.removeTag = function (value) {
        value = unescape(value);
        this.each(function () {
            var id = $(this).attr('id');

            var old = $(this).val().split(delimiter[id]);
            var str = $.grep(old, function (tag, i) {
                return tag != value;
            });
            $(this).importTags(str);

            $(this).trigger('removeTag', [value]);
        });
        return false;
    };

    $.fn.tagExist = function (val) {
        if ($.inArray(val, $(this)) == -1) {
            return false; /* Cannot find value in array */
        } else {
            return true; /* Value found */
        }
    };

    // clear all existing tags and import new ones from a string
    $.fn.importTags = function (str) {
        var id = $(this).attr('id');
        $('#' + id + '_tagsinput .tag').remove();
        $.fn.tagsInput.importTags(this, str);
    }

    $.fn.tagsInput = function (options) {
        var settings = $.extend({
            interactive: true,
            defaultText: 'add a tag',
            minChars: 0,
            width: '300px',
            height: '100px',
            autocomplete: {selectFirst: false},
            hide: true,
            delimiter: ',',
            unique: true,
            removeWithBackspace: true,
            placeholderColor: '#666666'
        }, options);

        this.each(function () {
            if (settings.hide) {
                $(this).hide();
            }

            var id = $(this).attr('id');

            var data = $.extend({
                pid: id,
                real_input: '#' + id,
                holder: '#' + id + '_tagsinput',
                input_wrapper: '#' + id + '_addTag',
                fake_input: '#' + id + '_tag'
            }, settings);

            delimiter[id] = data.delimiter;

            if (settings.onAddTag) {
                $(this).bind('addTag', settings.onAddTag);
            }
            if (settings.onRemoveTag) {
                $(this).bind('removeTag', settings.onRemoveTag);
            }
            if (settings.onChange) {
                $(this).bind('changeTag', settings.onChange);
            }

            var markup = '<div id="' + id + '_tagsinput" class="tagsinput"><div id="' + id + '_addTag">';

            if (settings.interactive) {
                markup = markup + '<input id="' + id + '_tag" value="" data-default="' + settings.defaultText + '" />';
            }

            markup = markup + '</div><div class="tags_clear"></div></div>';

            $(markup).insertAfter(this);

            $(data.holder).css('width', settings.width);
            $(data.holder).css('height', settings.height);

            if ($(data.real_input).val() != '') {
                $.fn.tagsInput.importTags($(data.real_input), $(data.real_input).val());
            }

            if (settings.interactive) {
                $(data.fake_input).val($(data.fake_input).attr('data-default'));
                $(data.fake_input).css('color', settings.placeholderColor);

                $(data.holder).bind('click', data, function (event) {
                    $(event.data.fake_input).focus();
                });

                $(data.fake_input).bind('focus', data, function (event) {
                    if ($(event.data.fake_input).val() == $(event.data.fake_input).attr('data-default')) {
                        $(event.data.fake_input).val('');
                    }
                    $(event.data.fake_input).css('color', '#000000');
                });

                if (settings.autocomplete_url != undefined) {
                    autocomplete_options = {source: settings.autocomplete_url};
                    for (attrname in settings.autocomplete) {
                        autocomplete_options[attrname] = settings.autocomplete[attrname];
                    }

                    if ($.Autocompleter !== undefined) {
                        $(data.fake_input).autocomplete(settings.autocomplete_url, settings.autocomplete);
                        $(data.fake_input).bind('result', data, function (event, data, formatted) {
                            if (data) {
                                d = data + "";
                                $(event.data.real_input).addTag(d,{focus:true,unique:(settings.unique)});
                            }
                        });
                    }
                    else if ($.ui.autocomplete !== undefined) {
                        $(data.fake_input).autocomplete(autocomplete_options);
                        $(data.fake_input).bind('autocompleteselect', data, function (event, ui) {
                            $(event.data.real_input).addTag(ui.item.value, {
                                focus: true,
                                unique: settings.unique
                            });
                            return false;
                        });
                    }
                }
                else {
                    // if a user tabs out of the field, create a new tag
                    // this is only available if autocomplete is not used.
                    $(data.fake_input).bind('blur', data, function (event) {
                        var d = $(this).attr('data-default');
                        if ($(event.data.fake_input).val() != '' && $(event.data.fake_input).val() != d) {
                            if( (event.data.minChars <= $(event.data.fake_input).val().length) && (!event.data.maxChars || (event.data.maxChars >= $(event.data.fake_input).val().length)) ) {
                                $(event.data.real_input).addTag($(event.data.fake_input).val(), {
                                    focus: true,
                                    unique: settings.unique
                                });
                            }
                        } else {
                            $(event.data.fake_input).val($(event.data.fake_input).attr('data-default'));
                            $(event.data.fake_input).css('color', settings.placeholderColor);
                        }
                        return false;
                    });
                }

                // if user types a comma, create a new tag
                $(data.fake_input).bind('keypress', data, function (event) {
                    if (event.which == event.data.delimiter.charCodeAt(0) || event.which == 13 ) {
                        if( (event.data.minChars <= $(event.data.fake_input).val().length) && (!event.data.maxChars || (event.data.maxChars >= $(event.data.fake_input).val().length)) ) {
                            $(event.data.real_input).addTag($(event.data.fake_input).val(), {
                                focus: true,
                                unique: settings.unique
                            });
                        }
                        return false;
                    }
                });

                // Delete last tag on backspace
                data.removeWithBackspace && $(data.fake_input).bind('keydown', function (event) {
                    if(event.keyCode == 8 && $(this).val() == '') {
                         event.preventDefault();
                         var last_tag = $(this).closest('.tagsinput').find('.tag:last').text();
                         var id = $(this).attr('id').replace(/_tag$/, '');
                         last_tag = last_tag.replace(/[\s]+x$/, '');
                         $('#' + id).removeTag(escape(last_tag));
                         $(this).trigger('focus');
                    };
                });

                $(data.fake_input).blur();
            }

            return true;
        });

        return this;
    };

    $.fn.tagsInput.updateTagsField = function (obj, tagslist) {
        var id = $(obj).attr('id');
        $(obj).val(tagslist.join(delimiter[id]));
    };

    $.fn.tagsInput.importTags = function (obj, val) {
        var $obj = $(obj);
        $obj.val('');
        var id = $(obj).attr('id');
        var tags = val.split(delimiter[id]);
        $.each(tags, function (i, tag) {
            $obj.addTag(tag, {
                focus: false,
                callback: false
            });
        });
    };

})(jQuery);
