// メニューボタンコントローラ
var controlMenu = function() {
    this.div;
    this.click_location_flg = false;
    this.mastodon_url;

    // メニューを初期化
    this.initMenu = function(mastodon_url, tag) {
        this.div = document.createElement('div');
        this.div.index = 1;
        this.mastodon_url = mastodon_url;
        this.div.innerHTML = "<div class='dropdown'>"
            + "<button class='btn btn-light dropdown-toggle' type='button' id='dropdownMenuButton' data-toggle='dropdown' aria-haspopup='true' aria-expanded='false'>"
            + "<span id='tapflgspan'>タップ[OFF]</span> / <span id='tagspan'>#"+tag+"</span>"
            + "</button>"
            + "<div class='dropdown-menu' aria-labelledby='dropdownMenuButton'>"
            + "<div class='dropdown-item' id='tapgeo'><p class='btn'>タップした位置を取得["+(this.click_location_flg?"OFF":"ON")+"]</p></div>"
            + "<div class='dropdown-item' id='nowgeo'><p class='btn'>現在位置を表示</p></div>"
            + "<div class='dropdown-item'>"
            + "#<input type='text' id='tag' value='"+tag+"'>"
            + "</div>"
            + "<div class='dropdown-item' id='past-tagtl'><p class='btn'>過去のトゥート</p></div>"
            + "<div class='dropdown-item'><a class='btn' target='_blank' id='tagtl' href='"+this.mastodon_url+"/tags/"+tag+"'>このタグの公開タイムライン</a></div>"
            + "<div class='dropdown-item'><a class='btn' target='_blank' href='https://biwakodon.com/about/more#biwakomap'>使い方はこちら</a></div>"
            + "</div>"
            + "</div>"
            + "</div>";
    }

    // タップの表示を切り替え
    this.changeTap = function() {
        this.click_location_flg = !this.click_location_flg;
        $('#tapgeo').html("<p class='btn'>タップした位置を取得["+(this.click_location_flg?"OFF":"ON")+"]</p>");
        $('#tapflgspan').text("タップ["+(this.click_location_flg?"ON":"OFF")+"]");
    }

    // タグの変更に対応
    this.changeTag = function(tag) {
        $('#tagspan').text("#"+tag);
        $('#tagtl').attr("href", this.mastodon_url+"/tags/"+tag);
    }

    // 最終取得トゥートの時間を表示
    this.getFormatDate = function(date) {
        if (isNaN(date)) { return ''; }
        var y = date.getFullYear();
        var m = date.getMonth() + 1;
        var d = date.getDate();
        var h = date.getHours();
        var M = date.getMinutes();
        var s = date.getSeconds();

        return y + '/' + m + '/' + d + ' ' + h + ':' + M + ':' + s;
    }
    this.setLastTootDate = function(last_date) {
        var date = new Date(last_date);
        var format_date = this.getFormatDate(date);
        if (format_date!="") {
            $('#past-tagtl').html("<p class='btn'>過去のトゥートを取得<br />（" + format_date + "以前）</p>");
        } else {
            $('#past-tagtl').html("");
            
        }
    }
}

// 地図
var tootMap = function(mastodon_url, map_url) {
    this.map;
    this.center;
    this.markers = [];
    this.now_geo_marker = null;
    this.open_window = null;
    this.mastodon_url = mastodon_url;
    this.map_url = map_url;
    this.watch_id = null;

    // メニューをマップ内に追加
    this.addMenu = function(position, menu) {
        this.map.controls[position].push(menu);
    }

    // 地図スタイルを変更
    this.changeMapStyle = function(roadmap_flg) {
        if (roadmap_flg) {
            this.map.setMapTypeId(google.maps.MapTypeId.ROADMAP);
        } else {
            this.map.setMapTypeId("simple_map");
        }
    }

    // 現在位置をマップ内に表示
    this.showNowGeo = function(tag) {
        if (navigator.geolocation) {
            var that = this;
            this.watch_id = navigator.geolocation.getCurrentPosition(
                function (pos) {
                    var now_geo = new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude);
                    var zoom = that.map.zoom < 13 ? 13 : that.map.zoom;
                    that.map.setZoom(zoom);
                    that.map.setCenter(now_geo);
                    if (that.now_geo_marker!=null) {
                        that.now_geo_marker.setMap(null);
                    }
                    that.now_geo_marker = that.createMarker(now_geo, that.createContent(now_geo.lat(), now_geo.lng(), tag), './nowgeo-icon.png', true);
                },
                function (error) {
                    var msg;
                    switch( error.code ){
                        case 1: msg = "位置情報の利用が許可されていません"; break;
                        case 2: msg = "位置が判定できません"; break;
                        case 3: msg = "タイムアウトしました"; break;
                    }
                    alert(msg);
                }
            );
        } else {
            alert("本ブラウザではGeolocationが使えません");
        }
    }

    // 地図を表示
    this.displayMap = function(center, zoom) {
        this.center = center;
        this.map = new google.maps.Map(document.getElementById('map'), {
            zoom: zoom,
            center: this.center,
            disableDefaultUI: true,
        });
        var simple_map_style = new google.maps.StyledMapType([
            {
                featureType: "poi",
                elementType: "labels",
                stylers: [
                    { visibility: "off" }
                ]
            }
        ], { name: "Simple Map" });
        this.map.mapTypes.set("simple_map", simple_map_style);
    }

    // マーカを作成し地図に表示
    this.createMarker = function(position, content, icon, flag) {
        content = typeof(content)=="undefined"?"":content;
        icon = typeof(icon)=="undefined"?"./biwakomap-icon.png":icon;
        flag = typeof(flag)=="undefined"?false:flag;
        var that = this;
        var marker = new google.maps.Marker({
            position: position,
            map: that.map,
            icon: {
                url: icon
            }
        });
        if (content!="") {
            var info_window = new google.maps.InfoWindow({
                content: content
            });
            marker.addListener('click', function(e){
                if (that.open_window) {
                    that.open_window.close();
                }
                info_window.open(that.map, marker);
                that.open_window = info_window;
                that.map.setCenter(marker.position);
                if (flag) {
                    document.getElementById('click-position').focus();
                    document.getElementById('click-position').select();
                    document.getElementById('click-position').setSelectionRange(0, 999);
                }
            });
        }
        return marker;
    }

    // 現在位置に等しい位置のマーカを取得
    this.getNowGeoMarker = function( lat, lng ) {
        just_marker=null;
        for( i=0;i<this.markers.length; i++ ) {
            var mlat = this.markers[i].position.lat();
            var mlng = this.markers[i].position.lng();
            if (mlat==lat && mlng==lng) {
                just_marker = this.markers[i];
                break;
            }
        }
        return just_marker;
    }
    // 現在位置のマーカを表示する（無ければ無印マーカ）
    this.displayPositionMarker = function(get_flg) {
        if (get_flg) {
            var just_marker = this.getNowGeoMarker( this.center.lat, this.center.lng );
            if (just_marker) {
                google.maps.event.trigger(just_marker, 'click');
            } else {
                new google.maps.Marker({
                    position: this.center,
                    map: this.map,
                    icon: './nowgeo-icon.png'
                });
            }
        }
    }

    this.createContent = function(lat, lng, tag) {
        return '<p>この位置についてトゥートする時にコピペしてください</p>'
                + '<textarea cols="30" rows="5" id="click-position" readonly>'
            + this.map_url + '/?lat=' + lat + '&lng=' + lng
            + '&amp;zoom=' + this.map.zoom
            + '&amp;tag=' + encodeURI(tag)
            + ' #' + tag
            + '</textarea>';
    }

    // 現在位置情報の表示
    this.showInfoWindow = function(lat, lng, tag) {
        if (this.open_window) {
            this.open_window.close();
        }
        var info_window=new google.maps.InfoWindow();
        info_window.setContent(this.createContent(lat, lng, tag));
        info_window.setPosition({lat: lat, lng: lng});
        info_window.open(this.map);
        this.open_window = info_window;
        document.getElementById('click-position').focus();
        document.getElementById('click-position').select();
        document.getElementById('click-position').setSelectionRange(0, 999);
    }

    this.clearMarkers = function() {
        for (var i in this.markers) {
            this.markers[i].setMap(null);
        }
        this.markers = [];
    }
}

// タイムライン
var timeline = function(api_url, map_url, tag) {
    this.api_url = api_url;
    this.map_url = map_url;
    this.tag = tag;
    this.limit = 40;
    this.max_id = "";
    this.last_date = "";
    this.timeline = [];

    this.setTag = function(tag) {
        this.tag = tag;
    }

    this.resetMaxId = function() {
        this.max_id = "";
    }

    this.displayLoader = function() {
        $('#loading').height($(window).height()).css('display','block');
    }
    this.hideLoader = function() {
        $('#loading').delay(600).fadeOut(300);
    }

    this.attachmentsHtml = function(toot) {
        if (toot['media_attachments'].length == '0') return '';
        var html='<div class="status__attachments__inner">';
        toot['media_attachments'].forEach(function(attachment) {
            html += '<div class="media-item">'
                +'<a style="background-image: url('+attachment['url']+')" target="_blank" rel="noopener" class="u-photo" href="'+attachment['url']+'"></a></div>';
        });
        html += '</div>';
        return html;
    }
    this.displayName = function(toot) {
        return toot['account']['display_name'] != '' ? toot['account']['display_name'] : toot['account']['username'];
    }
    this.createdAt = function(toot) {
        var date = new Date(toot['created_at']);
        return date.toLocaleString()
    }

    // ポップアップHtmlの作成
    this.innerHTML = function(toot) {
//        return '<iframe src="'+this.mastodon_url+'/@'+toot['account']['acct']+'/'+toot['id']+'/embed" class="mastodon-embed" style="max-width: 100%; border: 0" width="400"></iframe><script src="'+this.mastodon_url+'/embed.js" async="async"></script>';
        return '<div class="activity-stream activity-stream-headless h-entry">'
            +'<div class="entry entry-center">'
            +'<div class="detailed-status light">'
            +'<a class="detailed-status__display-name p-author h-card" rel="noopener" target="_blank" href="'+toot['account']['url']+'"><div>'
            +'<div class="avatar">'
            +'<img alt="" class="u-photo" src="'+toot['account']['avatar']+'" width="48" height="48">'
            +'</div>'
            +'</div>'
            +'<span class="display-name">'
            +'<strong class="p-name emojify">'+this.displayName(toot)+'</strong>'
            +'<span>@'+toot['account']['acct']+'</span>'
            +'</span>'
            +'</a><div class="status__content p-name emojify"><div class="e-content" style="display: block; direction: ltr" lang="ja"><p>'+toot['content']+'</p></div></div>'
            +this.attachmentsHtml(toot)
            +'<div class="detailed-status__meta">'
            +'<data class="dt-published" value="'+this.createdAt(toot)+'"></data>'
            +'<a class="detailed-status__datetime u-url u-uid" rel="noopener" target="_blank" href="'+toot['url']+'"><time class="formatted" datetime="'+toot['created_at']+'" title="'+this.createdAt(toot)+'">'+this.createdAt(toot)+'</time>'
            +'</a>'
            +'·'
            +'<span><i class="fa fa-retweet"></i><span>'+toot['reblogs_count']+' Reb</span></span>'
            +'·'
            +'<span><i class="fa fa-star"></i><span>'+toot['favourites_count']+' Fav</span></span>'
            +'·'
            +'<a class="open-in-web-link" target="_blank" href="'+toot['url']+'">Webで開く</a>'
            +'</div>'
            +'</div>'
            +'</div>'
            +'</div>';
    }

    // トゥートの拡張、内容の整形
    this.expandToot = function(elem) {
        var reg = new RegExp(this.map_url+"/\\?lat=(\\d+\.\\d+)&amp;lng=(\\d+\.\\d+)(&amp;zoom=(\\d+))?(&amp;tag=(\\w+))?");
        var match_str = elem['content'].match(reg);
        if (match_str) {
            elem['position'] = {lat: parseFloat(match_str[1]),lng: parseFloat(match_str[2])};
            elem['zoom'] = parseInt(match_str[4]);
            elem['tag'] = match_str[6];
            var html = $.parseHTML(elem['content']);
            var that = this;
            $.each(html, function(i, p){
                $.each(p.children, function(v, e){
                    console.info(e);
                    // マップへのリンクを消去
                    if (e.nodeName == "A" && "https://"+e.hostname == that.map_url) {
                        elem['content'] = elem['content'].replace(e.outerHTML, "");
                    }
                    // ハッシュタグを消去
                    if (e.nodeName == "A" && e.className == "mention hashtag" && e.innerText == "#"+that.tag) {
                        elem['content'] = elem['content'].replace(e.outerHTML, "");
                    }
                    // 添付ファイルパスを消去
                    if (e.nodeName == "A" && e.pathname.match(/^\/media\//)) {
                        elem['content'] = elem['content'].replace(e.outerHTML, "");
                    }
                });
            });
            elem['innerHTML'] = this.innerHTML(elem);
        } else {
            elem = null;
        }
        return elem;
    }

    // タイムラインの取得
    this.getTimeline = function(callback) {
        var tag_url = this.api_url + "?tag=" + this.tag + "&limit=" + this.limit + "&max_id=" + this.max_id;
        var xhr = new XMLHttpRequest();
        var that = this;
        xhr.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200 && this.responseText.length > 0) {
                if (this.responseText.length == 0) {
                    that.getTimeline(callback);
                } else {
                    var arr = JSON.parse(this.responseText);
                    var last_date=''
                    arr.forEach(function(toot) {
                        that.max_id = toot['id'];
                        that.last_date = toot['created_at'];
                        var toot = that.expandToot(toot);
                        if (toot!=null) {
                            that.timeline.push(toot);
                        }
                    });

                    callback(that.timeline);
                    
                    that.hideLoader();
                }
            }
        };
        xhr.open("GET", tag_url, true);
        xhr.send();
        this.displayLoader();
    }

    this.clearTimeline = function() {
        this.timeline = [];
    }
}

function getParam(parameter_name, def_val) {
    def_val = typeof(def_val)=="undefined"?"":def_val;
    var result = def_val, tmp = [];
    location.search.substr(1).split("&").forEach(function (item) {
        tmp = item.split("=");
        if (tmp[0] === parameter_name) result = decodeURIComponent(tmp[1]);
    });
    return result;
}

function initialize() {
    var api_url = "[MASTODON_API_URL(GET args: tag,limit,max_id)]";
    var mastodon_url = "[MASTODON_URL]";
    var map_url = "[MAP_URL]";
    var default_tag = "biwakomap"

    var get_flg = false;
    var lat = getParam('lat');
    if (!lat.match(/^\d+\.\d+$/)) {
        lat = 35.269452;
    }
    var lng = getParam('lng');
    if (!lng.match(/^\d+\.\d+$/)) {
        lng = 136.067194;
    }
    if (getParam('lat')!="" && getParam('lng')!="") {
        get_flg = true;
    }
    var zoom = getParam('zoom');
    if (!zoom.match(/^\d+$/)) {
        zoom = 10;
    }
    var tag = getParam('tag', default_tag);
//    if (!tag.match(/^([^\x01-\x7E\uFF61-\uFF9F]|\w)+$/)) {
//        tag = 'biwakomap';
//    }
    var params = {
        get_flg: get_flg,
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        zoom: parseInt(zoom),
        tag: tag
    };

    var cm = new controlMenu();
    cm.initMenu(mastodon_url, params.tag);

    var tm = new tootMap(mastodon_url, map_url);
    tm.displayMap({lat: params.lat, lng: params.lng}, params.zoom);
    tm.addMenu(google.maps.ControlPosition.LEFT_TOP, cm.div);

    var tl = new timeline(api_url, map_url, params.tag);
    tl.setTag(params.tag);
    tl.getTimeline(function(timeline) {
        timeline.forEach(function(toot) {
            tm.markers.push(tm.createMarker(toot['position'], toot['innerHTML']));            
        });
        tm.displayPositionMarker(params.get_flg);
        cm.setLastTootDate(tl.last_date);
    });

    $(cm.div).on('click', '#tapgeo', function() {
        tm.changeMapStyle(cm.click_location_flg);
        cm.changeTap();
    });
    $(cm.div).on('click', '#past-tagtl', function() {
        tl.getTimeline(function(timeline) {
            timeline.forEach(function(toot) {
                tm.markers.push(tm.createMarker(toot['position'], toot['innerHTML']));
            });
            cm.setLastTootDate(tl.last_date);
        });
    });
    $(cm.div).on('click', '#nowgeo', function() {
        tm.showNowGeo(tl.tag, tm);
    });

    $(cm.div).on('change', '#tag', function() {
        tm.clearMarkers();
        tl.clearTimeline();
        tl.setTag(this.value);
        tl.resetMaxId();
        cm.changeTag(tl.tag);
        tl.getTimeline(function(timeline) {
            timeline.forEach(function(toot) {
                tm.markers.push(tm.createMarker(toot['position'], toot['innerHTML']));            
            });
            cm.setLastTootDate(tl.last_date);
        });
    });

    google.maps.event.addListener(tm.map, 'click', function(e) {
        if (cm.click_location_flg) {
            tm.showInfoWindow(e.latLng.lat(), e.latLng.lng(), tl.tag);
        }
    });
}