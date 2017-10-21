// マストドンAPI
var mastodonAPI = function(map_url) {
    this.map_url = map_url;
    this.domain = localStorage.getItem('domain') ? localStorage.getItem('domain') : "";
    this.client_id = localStorage.getItem('client_id') ? localStorage.getItem('client_id') : null;
    this.client_secret = localStorage.getItem('client_secret') ? localStorage.getItem('client_secret') : null;
    this.code = localStorage.getItem('code') ? localStorage.getItem('code') : null;
    this.access_token = localStorage.getItem('access_token') ? localStorage.getItem('access_token') : null;
    this.avatar_icon = localStorage.getItem('avatar_icon') ? localStorage.getItem('avatar_icon') : "missing.png";
    this.username = localStorage.getItem('username') ? localStorage.getItem('username') : null;
    this.client_name = "biwakodonMap";
    this.media_urls = [];
    this.media_ids = [];

    this.clearInfo = function() {
        localStorage.clear();
    }

    this.getClientInfo = function(callback) {
        if (this.client_id==null || this.client_secret==null) {
            var url = "https://"+this.domain+"/api/v1/apps";
            var data = {client_name: this.client_name, redirect_uris: this.map_url, scopes: 'read write'};
            var xhr = new XMLHttpRequest();
            var that = this;
            xhr.onreadystatechange = function() {
                if (this.readyState == 4 && this.status == 200) {
                    if (this.responseText.length == 0) {
                        that.getClientInfo(callback);
                    } else {
                        var arr = JSON.parse(this.responseText);
                        if (typeof(arr['client_id']) != "undefined") {
                            that.client_id = arr['client_id'];
                            localStorage.setItem('client_id', that.client_id);
                        }
                        if (typeof(arr['client_secret']) != "undefined") {
                            that.client_secret = arr['client_secret'];
                            localStorage.setItem('client_secret', that.client_secret);
                        }
                        callback();
                    }
                }
            };
            xhr.open("POST", url, true);
            xhr.setRequestHeader("Content-Type", "application/json");
            xhr.send(JSON.stringify(data));
        } else {
            callback();
        }
    }
    this.openAuthWindow = function() {
        if (this.code==null) {
            var url = "https://"+this.domain+"/oauth/authorize?"+"client_id="+this.client_id+"&response_type=code&redirect_uri="+this.map_url+"&scope=read%20write";
            location.href = url;
        }
    }
    this.getAccessToken = function(callback) {
        if (this.access_token==null) {
            var url = "https://"+this.domain+"/oauth/token";
            var data = {grant_type: "authorization_code", redirect_uri: this.map_url, client_id: this.client_id, client_secret: this.client_secret, code: this.code};
            var xhr = new XMLHttpRequest();
            var that = this;
            xhr.onreadystatechange = function() {
                if (this.readyState == 4 && this.status == 200) {
                    if (this.responseText.length == 0) {
                        that.getAccessToken(callback);
                    } else {
                        var arr = JSON.parse(this.responseText);
                        if (typeof(arr['access_token']) != "undefined") {
                            that.access_token = arr['access_token'];
                            localStorage.setItem('access_token', that.access_token);
                        }
                        callback();
                    }
                }
            };
            xhr.open("POST", url, true);
            xhr.setRequestHeader("Content-Type", "application/json");
            xhr.send(JSON.stringify(data));
        } else {
            callback();
        }
    }
    this.getInfo = function(callback) {
        if (this.avatar_icon=="missing.png") {
            var url = "https://"+this.domain+"/api/v1/accounts/verify_credentials";
            var xhr = new XMLHttpRequest();
            var that = this;
            xhr.onreadystatechange = function() {
                if (this.readyState == 4 && this.status == 200) {
                    if (this.responseText.length == 0) {
                        that.getAccessToken(callback);
                    } else {
                        var arr = JSON.parse(this.responseText);
                        if (typeof(arr['avatar']) != "undefined") {
                            that.avatar_icon = arr['avatar'];
                            localStorage.setItem('avatar_icon', that.avatar_icon);
                        }
                        if (typeof(arr['username']) != "undefined") {
                            that.username = arr['username'];
                            localStorage.setItem('username', that.username);
                        }
                        callback();
                    }
                }
            };
            xhr.open("GET", url, true);
            xhr.setRequestHeader("Authorization","Bearer "+this.access_token);
            xhr.send();
        } else {
            callback();
        }
    }
    this.toot = function(status, callback) {
        if (this.access_token!=null) {
            var url = "https://"+this.domain+"/api/v1/statuses";
            var data = {status: status, visibility: 'public', media_ids: this.media_ids};
            var xhr = new XMLHttpRequest();
            var that = this;
            xhr.onreadystatechange = function() {
                if (this.readyState == 4 && this.status == 200) {
                    var arr = JSON.parse(this.responseText);
                    callback(arr);
                }
            };
            xhr.open("POST", url, true);
            xhr.setRequestHeader("Content-Type", "application/json");
            xhr.setRequestHeader("Authorization","Bearer "+this.access_token);
            xhr.send(JSON.stringify(data));
        } else {
            alert("アカウント連携情報がありません");
        }
    }
    this.mediaUpload = function(file, callback) {
        if (this.access_token!=null) {
            var data = new FormData();
            data.append("file", file);
            var url = "https://"+this.domain+"/api/v1/media";
            var xhr = new XMLHttpRequest();
            var that = this;
            xhr.onreadystatechange = function() {
                if (this.readyState == 4 && this.status == 200) {
                    var arr = JSON.parse(this.responseText);
                    callback(arr);
                }
            };
            xhr.open("POST", url, true);
            xhr.setRequestHeader("Authorization","Bearer "+this.access_token);
            xhr.send(data);
        } else {
            alert("アカウント連携情報がありません");
        }
    }
}

// メニューボタンコントローラ
var controlMenu = function() {
    this.div;
    this.click_location_flg = false;
    this.mastodon_url;

    // メニューを初期化
    this.initMenu = function(mastodon_url, tag, mapi) {
        this.mastodon_url = mastodon_url;
        $("#setting").html(
            "<a class='btn btn-block btn-light' id='MapButton' href='#'>マップに戻る</a>"
            + "<a class='btn btn-block btn-light' id='tapgeo' href='#'>タップした位置を取得["+(this.click_location_flg?"OFF":"ON")+"]</a>"
            + "<a class='btn btn-block btn-light' id='nowgeo' href='#'>現在位置を表示</a>"
            + "<div class='btn btn-block btn-light'>タグ：　#<input type='text' id='tag' value='"+tag+"'></div>"
            + "<a class='btn btn-block btn-light' id='past-tagtl' href='#'>過去のトゥート</a>"
            + "<a class='btn btn-block btn-light' id='tagtl' href='"+this.mastodon_url+"/tags/"+tag+"' target='_blank'>このタグの公開タイムライン</a>"
            + "<a class='btn btn-block btn-light' target='_blank' href='https://biwakodon.com/about/more#biwakomap'>使い方はこちら</a>"
            + "<div class='btn btn-block btn-light "+(mapi.access_token==null?"":"hidden")+"' id='loginDiv'>連携ドメイン：<input type='text' id='domain' value='"+mapi.domain+"'></div>"
            + "<a class='btn btn-block btn-light "+(mapi.access_token==null?"":"hidden")+"' id='login' href='#'>アカウント連携</a>"
            + "<a class='btn btn-block btn-light "+(mapi.access_token!=null?"":"hidden")+"' id='logout' href='#'><img id='avatarIcon' src='"+mapi.avatar_icon+"' height='46px' />アカウント連携解除</a>"
        );
        this.div = document.createElement('div');
        this.div.index = 1;
        this.div.innerHTML = "<a class='btn btn-light' id='MenuButton' href='#'><span id='tapflgspan'>タップ[OFF]</span> / <span id='tagspan'>#"+tag+"</span></a>";
    }

    // タップの表示を切り替え
    this.changeTap = function() {
        this.click_location_flg = !this.click_location_flg;
        $('#tapgeo').html("タップした位置を取得["+(this.click_location_flg?"OFF":"ON")+"]");
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
            $('#past-tagtl').html("過去のトゥートを取得<br />（" + format_date + "以前）");
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
    this.lat;
    this.lng;

    this.setLatLng = function(lat, lng) {
        this.lat = lat;
        this.lng = lng;
    }

    // メニューをマップ内に追加
    this.addMenu = function(position, menu) {
        this.map.controls[position].push(menu);
    }

    // メニュー削除
    this.clearMenu = function(position) {
        this.map.controls[position] = [];
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
    this.showNowGeo = function(tag, mapi) {
        if (navigator.geolocation) {
            var that = this;
            this.watch_id = navigator.geolocation.getCurrentPosition(
                function (pos) {
                    that.setLatLng(pos.coords.latitude, pos.coords.longitude);
                    var now_geo = new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude);
                    var zoom = that.map.zoom < 13 ? 13 : that.map.zoom;
                    that.map.setZoom(zoom);
                    that.map.setCenter(now_geo);
                    if (that.now_geo_marker!=null) {
                        that.now_geo_marker.setMap(null);
                    }
                    that.now_geo_marker = that.createMarker(now_geo, that.createContent(that.lat, that.lng, tag, mapi), './nowgeo-icon.png', mapi.access_token==null);
                    google.maps.event.trigger(that.now_geo_marker, 'click');
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

    this.mappingText = function(lat, lng, tag) {
        return this.map_url + '?lat=' + lat + '&lng=' + lng
        + '&zoom=' + this.map.zoom
        + '&tag=' + encodeURI(tag)
        + ' #' + tag;
    }

    this.createContent = function(lat, lng, tag, mapi) {
        var content = '<p>この位置についてトゥートする時にコピペしてください</p>'
            + '<textarea cols="30" rows="5" id="click-position" readonly>'+this.mappingText(lat, lng, tag)+'</textarea>';
        if (mapi.access_token!=null) {
            var attamchments = "";
            var i = 0;
            mapi.media_urls.forEach(function(url) {
                attamchments += '<div class="media-item" id="media-'+mapi.media_ids[i]+'"><a style="background-image: url('+url+')" target="_blank" rel="noopener" class="u-photo" href="'+url+'"></a><button class="icon-button" media_id="'+mapi.media_ids[i]+'"><i class="fa fa-fw fa-times" aria-hidden="true" style="transform: rotate(0deg);"></i></button></div>';
                i++;
            });
            content = '<div class="detailed-status light"><a class="detailed-status__display-name p-author h-card" rel="noopener" target="_blank" href="">'
                + '<div class="avatar"><img src="'+mapi.avatar_icon+'" height="48px" /></div>'
                + '<span class="display-name"><span>'+mapi.username+'@'+mapi.domain+'</span></span></a>'
                + '<textarea cols="30" rows="5" id="status"></textarea>'
                + '<div><p class="btn btn-primary" id="toot">公開Toot</p>　<p class="btn btn-primary" id="media"><i class="fa fa-camera" aria-hidden="true"></i></p><input type="file" name="media"></div>'
                + '<div class="status__attachments__inner" id ="attachments" '+(mapi.media_urls.length==0?'style="display:none"':'')+'>'
                + attamchments
                + '</div>'
                + '</div>';
        }
        return content;
    }

    this.showMediaLoader = function() {
        $("#attachments").show();
        $("#attachments").append('<div class="media-item media-loader"><a href="#"><img src="./loading.gif"  /></a></div>');
    }
    this.hideMediaArea = function() {
        $("#attachments").hide();
    }
    this.hideMediaLoader = function() {
        $(".media-loader").hide();
    }

    this.addAttachMedia = function(url, id) {
        $("#attachments").append('<div class="media-item" id="media-'+id+'"><a style="background-image: url('+url+')" target="_blank" rel="noopener" class="u-photo" href="'+url+'"></a><button class="icon-button" media_id="'+id+'"><i class="fa fa-fw fa-times" aria-hidden="true" style="transform: rotate(0deg);"></i></button></div>');
    }

    // 現在位置情報の表示
    this.showInfoWindow = function(lat, lng, tag, mapi) {
        if (this.open_window) {
            this.open_window.close();
        }
        var info_window=new google.maps.InfoWindow();
        info_window.setContent(this.createContent(lat, lng, tag, mapi));
        info_window.setPosition({lat: lat, lng: lng});
        info_window.open(this.map);
        this.open_window = info_window;
        if (mapi.access_token==null) {
            document.getElementById('click-position').focus();
            document.getElementById('click-position').select();
            document.getElementById('click-position').setSelectionRange(0, 999);
        }
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
            if (this.readyState == 4 && this.status == 200) {
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

function showMenu() {
    $("#map").hide();
    $("#setting").show();    
}
function showMap() {
    $("#setting").hide();
    $("#map").show();
}

function initialize() {
    var api_url = "[MASTODON_API_URL(GET args: tag,limit,max_id)]";
    var mastodon_url = "[MASTODON_URL]";
    var map_url = "[MAP_URL]";
    var default_tag = "biwakomap";

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
    var map_params = {
        get_flg: get_flg,
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        zoom: parseInt(zoom),
        tag: tag
    };

    $("body").on("click", "#MenuButton", showMenu);
    $("body").on("click", "#MapButton", showMap);

    var code = getParam('code');
    if (code!="") {
        localStorage.setItem('code', code);
    }

    var mapi = new mastodonAPI(map_url);

    var cm = new controlMenu();
    cm.initMenu(mastodon_url, map_params.tag, mapi);

    var tm = new tootMap(mastodon_url, map_url);
    tm.displayMap({lat: map_params.lat, lng: map_params.lng}, map_params.zoom);
    tm.addMenu(google.maps.ControlPosition.LEFT_TOP, cm.div);

    var tl = new timeline(api_url, map_url, map_params.tag);
    tl.setTag(map_params.tag);
    tl.getTimeline(function(timeline) {
        timeline.forEach(function(toot) {
            tm.markers.push(tm.createMarker(toot['position'], toot['innerHTML']));            
        });
        tm.displayPositionMarker(map_params.get_flg);
        cm.setLastTootDate(tl.last_date);
    });

    $("body").on('click', '#tapgeo', function() {
        tm.changeMapStyle(cm.click_location_flg);
        cm.changeTap();
        showMap();
    });
    $("body").on('click', '#past-tagtl', function() {
        tl.getTimeline(function(timeline) {
            timeline.forEach(function(toot) {
                tm.markers.push(tm.createMarker(toot['position'], toot['innerHTML']));
            });
            cm.setLastTootDate(tl.last_date);
        });
        showMap();
    });
    $("body").on('click', '#nowgeo', function() {
        tm.showNowGeo(tl.tag, mapi);
        showMap();
    });

    $("body").on('change', '#tag', function() {
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
        showMap();
    });

    $("body").on('click', '#login', function() {
        if (mapi.domain!="") {
            localStorage.setItem("domain", mapi.domain);
            mapi.getClientInfo(function() {
                mapi.openAuthWindow();
            });
        } else {
            alert("連携ドメインを入力してください");
        }
        return false;
    });
    $("body").on('click', '#logout', function() {
        mapi.clearInfo();
        location.href = mapi.map_url;
        return false;
    });
    if (code!="") {
        mapi.getAccessToken(function() {
            mapi.getInfo(function() {
                cm.initMenu(mastodon_url, map_params.tag, mapi);
            });
        });
    }
    $("body").on('change', '#domain', function() {
        var domain = this.value.replace(/[^0-9a-z\.]/gi, '');
        mapi.domain = domain;
        this.value = domain;
    });
    $("body").on('click', '#toot', function() {
        var status = $("#status").val();
        status += "\n"+tm.mappingText(tm.lat, tm.lng, tl.tag);
        mapi.toot(status, function(response) {
            tm.open_window.close();
            mapi.media_ids = [];
            mapi.media_urls = [];
            var toot = tl.expandToot(response);
            tm.markers.push(tm.createMarker(toot['position'], toot['innerHTML']));  
        });
    });
    $("body").on('click', '#media', function() {
        if (mapi.media_ids.length >= 4) {
            alert("添付できるファイルは4つまでです");
        } else {
            $("input[type=file]").click();
        }
    });
    $("body").on("change", 'input[type=file]', function() {
        tm.showMediaLoader();
        mapi.mediaUpload(this.files[0], function(response) {
            tm.hideMediaLoader();
            var url = response["preview_url"];
            var id = response["id"];
            tm.addAttachMedia(url, id);
            mapi.media_ids.push(id);
            mapi.media_urls.push(url);
        });
    });
    $("body").on("click", ".icon-button", function() {
        var media_id = this.getAttribute("media_id");
        $("#media-"+media_id).remove();
        i = mapi.media_ids.indexOf(media_id);
        mapi.media_ids.splice(i, 1);
        mapi.media_urls.splice(i, 1);
        if (mapi.media_ids.length < 1) {
            tm.hideMediaArea();
        }
    });

    google.maps.event.addListener(tm.map, 'click', function(e) {
        if (cm.click_location_flg) {
            tm.setLatLng(e.latLng.lat(), e.latLng.lng());
            tm.showInfoWindow(e.latLng.lat(), e.latLng.lng(), tl.tag, mapi);
        }
    });
}