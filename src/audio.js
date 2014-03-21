String.prototype.trim = function () {
    return this.replace(/^\s+|\s+$/g, '');
}

if (typeof window.audio == 'undefined') {
    window.audio = {};
}
var profile = {};

window.audio.check_post = function (callback) {
    var data = {count: 10};

    VK.api('getProfiles', {fields: 'sex'}, function (result) {
        profile = result['response'];
        profile = profile[0];
        VK.api('wall.get', data, function (result) {
            var check_post = 0;

            if (typeof result['response'] == 'undefined') {
                check_post = -1;
                if (typeof callback == 'function') {
                    callback(check_post);
                }
                return check_post;

            }

            var text1 = 'Я отсортировал свою музыку с помощью этого приложения. Попробуй и ты!';
            var text2 = 'Я отсортировала свою музыку с помощью этого приложения. Попробуй и ты!';
            var text3 = 'Я отсортировал(а) свою музыку с помощью этого приложения. Попробуй и ты!';

            for (var key in result['response']) {
                if (result['response'][key]['text'] == text1 || result['response'][key]['text'] == text2 || result['response'][key]['text'] == text3) {
                    check_post = 1;
                    if (typeof callback == 'function') {
                        callback(check_post);
                    }
                    return check_post;

                }
            }

            check_post = -1;
            if (typeof callback == 'function') {
                callback(check_post);
            }
            return check_post;

        });
    });
}

window.audio.get_all_audio = function (id, callback) {
    var data = {};

    VK.api('audio.get', data, function (result) {
        if (result.response) {
            $('#order_all').html(result.response.length);
            if (typeof callback == 'function') {
                callback(result.response);
                return true;
            }
            else {
                return result;
                return false;
            }
        }
        return false;
    });
};

window.audio.sort_audio = function (items, field_1, field_2) {
    var jump = items.length;
    var swapped = true;

    while (jump > 1 || swapped) {
        if (jump > 1) {
            jump = Math.floor(jump / 1.24733);
        }
        swapped = false;
        for (var i = 0; i + jump < items.length; i++) {
            if (items[i][field_1] > items[i + jump][field_1]) // сторона сортировки, >
            {
                var temp = items[i];
                items[i] = items[i + jump];
                items[i + jump] = temp;
                swapped = true;
            }
        }
    }

    var count = 0;
    var offset = 0;

    for (var key = 0; key < items.length; key++) {
        if (typeof items[key + 1] == 'undefined') {
            break;
        }

        var item_current = items[key];
        var item_next = items[key + 1];

        if (item_current[field_1] == item_next[field_1]) {
            count++;
        } else {
            var jump = count;
            var swapped = true;

            while (jump > 1 || swapped) {
                if (jump > 1) {
                    jump = Math.floor(jump / 1.24733);
                }
                swapped = false;
                for (var i = offset; i + jump < count + offset; i++) {
                    if (items[i][field_2] > items[i + jump][field_2]) // сторона сортировки
                    {
                        var temp = items[i];
                        items[i] = items[i + jump];
                        items[i + jump] = temp;
                        swapped = true;
                    }
                }
            }
            offset = key + 1;
            count = 1;
        }
    }
    if (count > 1) {
        var jump = count;
        var swapped = true;

        while (jump > 1 || swapped) {
            if (jump > 1) {
                jump = Math.floor(jump / 1.24733);
            }
            swapped = false;
            for (var i = offset; i + jump < count + offset; i++) {
                if (items[i][field_2] > items[i + jump][field_2]) // сторона сортировки
                {
                    var temp = items[i];
                    items[i] = items[i + jump];
                    items[i + jump] = temp;
                    swapped = true;
                }
            }
        }
    }

    return items;
};

window.audio.clone = function (items) {
    var items_clone = [];
    for (var key in items) {
        items_clone[key] = items[key];
    }
    return items_clone;
};

window.audio.reorder = function (reorders, count, aids_items, callback) {
    if (typeof reorders[count] == 'undefined') {
        if (typeof callback == 'function') {
            $('#order_count').html(reorders.length);
            $('#order_from').html('...');
            $('#order_to').html('...');
            $('#order_status').html('Список отсортирован!');
            callback();
        }
        return true;
    }
    $('#order_count').html(reorders.length - count);
    $('#order_from').html('<b>' + aids_items[reorders[count]['aid']]['artist'] + '</b> - ' + aids_items[reorders[count]['aid']]['title']);
    $('#order_to').html('<b>' + aids_items[reorders[count]['after']]['artist'] + '</b> - ' + aids_items[reorders[count]['after']]['title']);
    $('#order_status').html('Перемещается');
    setTimeout(function () {
        VK.api('audio.reorder', reorders[count], function (result) {
            if (typeof result.response == 'undefined') {
                setTimeout(function () {
                    audio.reorder(reorders, count, aids_items, callback);
                }, 300);
                return true;
            }
            $('order_status').html('Перемещено');
            count++;
            if (count < reorders.length) {
                audio.reorder(reorders, count, aids_items, callback);
            } else {
                $('#order_count').html(reorders.length - count);
                $('#order_from').html('...');
                $('#order_to').html('...');
                $('#order_status').html('Список отсортирован!');
                if (typeof callback == 'function') {
                    callback();
                }
            }
        });
    }, 100);
}

window.audio.show = function (items) {
    for (var key in items) {
        var item = items[key];

        console.log(item['artist'] + ' - ' + item['title']);
    }
}

window.audio.submit = function () {
    window.audio.check_post(function (result) {
        if (result == 1) {
            window.audio.start_sort();
        } else {
            VK.api('audio.get', {count: 5}, function (result) {
                var attachments = '';
                if (typeof result['response'] != 'undefined') {
                    for (var key in result['response']) {
                        attachments += 'audio' + result['response'][key]['owner_id'] + '_' + result['response'][key]['aid'] + ',';
                    }
                }
                var data = {owner_id: VK.id, message: 'Я ' + (function () {switch (profile['sex']) {case(1):return 'отсортировала';break;case(2):return 'отсортировал';break;default:return 'отсортировал(а)';break;}})() + ' свою музыку с помощью этого приложения. Попробуй и ты!', attachments: attachments + 'photo167341624_302334205,http://vk.com/app3611826'};
                VK.api('wall.post', data, function (result) {
                    if (typeof result['response'] == 'undefined') {
                    } else {
                        window.audio.start_sort();
                    }
                });
            });
        }
    });
    return false;
}

window.audio.start_sort = function () {
    $('#show_post').hide();
    audio.get_all_audio(VK.id, function (items) {

        for (var key in items) {
            items[key]['artist'] = items[key]['artist'].trim();
            items[key]['title'] = items[key]['title'].trim();
        }

        var items_no_sort = audio.clone(items);
        var items_sort = audio.clone(items);
        audio.sort_audio(items_sort, 'artist', 'title');

        var aids_items = {};

        for (var key in items_sort) {
            aids_items[items_sort[key]['aid']] = items_sort[key];
        }

        var reorder = [];

        for (var i = 0; i < items_no_sort.length; i++) {
            if (items_no_sort[i]['aid'] != items_sort[i]['aid']) {
                var after_aid = 0;
                var aid = items_no_sort[i]['aid'];

                for (var j = 0; j < items_sort.length; j++) {
                    if (items_sort[j]['aid'] == items_no_sort[i]['aid']) {
                        if (typeof items_sort[j - 1] == 'undefined') {
                            after_aid = 0;
                        } else {
                            after_aid = items_sort[j - 1]['aid'];
                        }
                        break;
                    }
                }

                var temp = items_no_sort[i];
                for (var j = i; j < items.length; j++) {
                    items_no_sort[j] = items_no_sort[j + 1];
                    if (items_no_sort[j + 1]['aid'] == after_aid) {
                        items_no_sort[j + 1] = temp;
                        break;
                    }
                }

                reorder[reorder.length] = {aid: aid, after: after_aid};

                i--;
            }
        }

        if (reorder.length > items_sort.length) {
            reorder = [];

            for (var i = 1; i < items_sort.length; i++) {
                reorder[reorder.length] = {aid: items_sort[i]['aid'], after: items_sort[i - 1]['aid']};
            }
        }

        /*window.audio.reorder(reorder, 0, aids_items, function(){});

         return false;*/


        var execute = [];
        var code_reorder = [];

        window.audio.execute = function (execute, count, callback) {
            if (count < execute.length) {
                $('#order_status').html('Идет сортировка...');
                setTimeout(function () {
                    VK.api('execute', execute[count], function (result) {
                        if (typeof result['response'] == 'undeifined') {
                            window.audio.execute(execute, count, callback);
                        } else {
                            $('#order_count').html((execute.length - count) < 0 ? 0 : (execute.length - count));
                            console.log(result);
                            console.log(execute[count]);
                            window.audio.execute(execute, ++count, callback);
                        }
                    });
                }, 50);
            } else {
                $('#order_count').html(0);
                $('#order_from').html('...');
                $('#order_to').html('...');
                $('#order_status').html('Список отсортирован!');
                if (typeof callback == 'function') {
                    callback();
                }
                return true;
            }
        }

        for (var key in reorder) {
            if (key != 0 && key % 25 == 0) {
                var code_data = JSON.stringify(code_reorder);
                execute[execute.length] = {code: 'var data = ' + code_data + '; var a = 0; while(a < ' + code_reorder.length + ') { API.audio.reorder(data[a]); a = a + 1; }; return a;'};
                code_reorder = [];
            }
            code_reorder[code_reorder.length] = reorder[key];
        }

        if (code_reorder.length > 0) {
            var code_data = JSON.stringify(code_reorder);
            execute[execute.length] = {code: 'var data = ' + code_data + '; var a = 0; while(a < ' + code_reorder.length + ') { API.audio.reorder(data[a]); a = a + 1; }; return a;'};
        }

        window.audio.execute(execute, 0, function () {
        });
    });
};

