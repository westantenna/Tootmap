var tootMap = {
    before_map_domain: "map.biwakodon.com",
    map_domain: "[MAP_DOMAIN]",
    default_tag: localStorage.getItem('default_tag') ? localStorage.getItem('default_tag') : "[DEFAULT_TAG]",
    client_name: "[CLIENT_NAME]",
    mstdn_domain: localStorage.getItem('mstdn_domain') ? localStorage.getItem('mstdn_domain') : "",
    modal_flg: localStorage.getItem('modal_flg') ? localStorage.getItem('modal_flg') : null,
    
    params: {
        lat: null,
        lng: null,
        zoom: null,
        tag: null,
        get_flg: null,
        code: null,

        _get: function(parameter_name, rule, def_val) {
            def_val = typeof(def_val)=="undefined"?null:def_val;
            var ret = def_val, tmp = [];
            location.search.substr(1).split("&").forEach(function (item) {
                tmp = item.split("=");
                param = decodeURIComponent(tmp[1]);
                if (tmp[0] === parameter_name && (typeof(rule) == "undefined" || rule == null || param.match(rule))) ret = param;
            });
            return ret;
        },
        get: function() {
            this.lat = parseFloat(this._get('lat', /^\d+\.\d+$/, 35.269452));
            this.lng = parseFloat(this._get('lng', /^\d+\.\d+$/, 136.067194));
            this.zoom = parseInt(this._get('zoom', /^\d+$/, 10));
            this.tag = this._get('tag', null, tootMap.default_tag);
            this.get_flg = this._get('lat')!=null;
            this.code = this._get('code');
        }
    },

    timeline: {
        api_url: "[API_URL]",
        limit: 40,
        max_id: "",
        last_date: "",
        toot_list: [],

        attachmentsHtml: function(toot) {
            if (toot['media_attachments'].length == '0') return '';
            var html='<div class="status__attachments__inner">';
            toot['media_attachments'].forEach(function(attachment) {
                html += '<div class="media-item">'
                    +'<a style="background-image: url('+attachment['url']+')" target="_blank" rel="noopener" class="u-photo" href="'+attachment['url']+'"></a></div>';
            });
            html += '</div>';
            return html;
        },
        // ポップアップHtmlの作成
        innerHTML: function(toot) {
            var date = new Date(toot['created_at']);
            date = date.toLocaleString();
        //        return '<iframe src="'+this.mastodon_url+'/@'+toot['account']['acct']+'/'+toot['id']+'/embed" class="mastodon-embed" style="max-width: 100%; border: 0" width="400"></iframe><script src="'+this.mastodon_url+'/embed.js" async="async"></script>';
            return '<div class="activity-stream activity-stream-headless h-entry"><div class="entry entry-center"><div class="detailed-status light">'
                +'<a class="detailed-status__display-name p-author h-card" rel="noopener" target="_blank" href="'+toot['account']['url']+'">'
                    +'<div><div class="avatar">'
                        +'<img alt="" class="u-photo" src="'+toot['account']['avatar']+'" width="48" height="48">'
                    +'</div></div>'
                    +'<span class="display-name">'
                        +'<strong class="p-name emojify">'+twemoji.parse(toot['account']['display_name'] != '' ? toot['account']['display_name'] : toot['account']['username'])+'</strong>'
                        +'<span>@'+toot['account']['acct']+'</span>'
                    +'</span>'
                +'</a>'
                +'<div class="status__content p-name emojify"><div class="e-content" style="display: block; direction: ltr" lang="ja"><p>'+twemoji.parse(toot['content'])+'</p></div></div>'
                +tootMap.timeline.attachmentsHtml(toot)
                +'<div class="detailed-status__meta">'
                    +'<data class="dt-published" value="'+date+'"></data>'
                    +'<a class="detailed-status__datetime u-url u-uid" rel="noopener" target="_blank" href="'+toot['url']+'"><time class="formatted" datetime="'+toot['created_at']+'" title="'+date+'">'+date+'</time></a>'
                    +'·'
                    +'<span><i class="fa fa-retweet"></i><span>'+toot['reblogs_count']+' Reb</span></span>'
                    +'·'
                    +'<span><i class="fa fa-star"></i><span>'+toot['favourites_count']+' Fav</span></span>'
                    +'·'
                    +'<a class="open-in-web-link" target="_blank" href="'+toot['url']+'">Webで開く</a>'
                +'</div>'
            +'</div></div></div>';
        },

        // トゥートの拡張、内容の整形
        setupToot: function(elem) {
            var reg = new RegExp("("+tootMap.map_domain+"|"+tootMap.before_map_domain+")/\\?lat=(\\d+\.\\d+)&amp;lng=(\\d+\.\\d+)(&amp;zoom=(\\d+))?(&amp;tag=(\\w+))?");
            var match_str = elem['content'].match(reg);
            if (match_str) {
                elem['position'] = {lat: parseFloat(match_str[2]),lng: parseFloat(match_str[3])};
                elem['zoom'] = parseInt(match_str[5]);
                elem['tag'] = match_str[7];
                var html = $.parseHTML(elem['content']);
                $.each(html, function(i, p){
                    $.each(p.children, function(v, e){
                        // マップへのリンクを消去
                        if (e.nodeName == "A" && (e.hostname == tootMap.map_domain || e.hostname == tootMap.before_map_domain)) {
                            elem['content'] = elem['content'].replace(e.outerHTML, "");
                        }
                        // ハッシュタグを消去
                        if (e.nodeName == "A" && e.className == "mention hashtag" && e.innerText == "#"+tootMap.params.tag) {
                            elem['content'] = elem['content'].replace(e.outerHTML, "");
                        }
                        // 添付ファイルパスを消去
                        if (e.nodeName == "A" && e.pathname.match(/^\/media\//)) {
                            elem['content'] = elem['content'].replace(e.outerHTML, "");
                        }
                    });
                });
                elem['emojis'].forEach(function(emoji) {
                    var r = new RegExp(":"+emoji['shortcode']+":");
                    while (elem['content'].match(r)) {
                        elem['content'] = elem['content'].replace(r, '<img draggable="false" class="emojione" alt="'+emoji['shortcode']+'" title="'+emoji['shortcode']+'" src="'+emoji['url']+'">');
                    }
                });
                elem['innerHTML'] = tootMap.timeline.innerHTML(elem);
            } else {
                elem = null;
            }
            return elem;
        },

        // タイムラインの取得
        get: function() {
            if (tootMap.mstdn_domain!="") {
                var tag_url = "https://" + tootMap.mstdn_domain + "/api/v1/timelines/tag/" + encodeURIComponent(tootMap.params.tag) + "?limit=" + tootMap.timeline.limit + "&max_id=" + tootMap.timeline.max_id;
            } else {
                var tag_url = tootMap.timeline.api_url + "?tag=" + tootMap.params.tag + "&limit=" + tootMap.timeline.limit + "&max_id=" + tootMap.timeline.max_id;
            }
            var xhr = new XMLHttpRequest();
            xhr.onreadystatechange = function() {
                if (this.readyState == 4 && this.status == 200) {
                    if (this.responseText.length == 0) {
                        tootMap.timeline.get();
                    } else {
                        var arr = JSON.parse(this.responseText);
                        var page_load_flg = tootMap.timeline.toot_list.length == 0;
                        arr.forEach(function(toot) {
                            tootMap.timeline.max_id = toot['id'];
                            tootMap.timeline.last_date = toot['created_at'];
                            var toot = tootMap.timeline.setupToot(toot);
                            if (toot!=null) {
                                tootMap.timeline.toot_list.push(toot);
                                tootMap.gmap.markers.push(tootMap.gmap.createMarker(toot['position'], toot['innerHTML']));
                            }
                        });

                        var bounds = new google.maps.LatLngBounds();
                        tootMap.timeline.toot_list.forEach(function(toot) {
                            bounds.extend(toot['position']);
                        });
                        if (tootMap.timeline.toot_list.length > 0) {
                            if (!tootMap.params.get_flg) {
                                tootMap.gmap.map.fitBounds(bounds);
                            }

                            var date = new Date(tootMap.timeline.last_date);
                            $("#past-tagtl").html("過去のトゥートを取得<br />("+tootMap.getFormatDate(date)+"以前)");
                        }
                        if (tootMap.params.get_flg && page_load_flg) {
                            tootMap.gmap.displayPositionMarker(tootMap.gmap.map.getCenter());
                        }

                        tootMap.hideLoader();
                    }
                }
            };
            xhr.open("GET", tag_url, true);
            xhr.send();
            tootMap.displayLoader();
        },
        clear: function() {
            tootMap.timeline.toot_list = [];
            tootMap.timeline.max_id = "";
        }
    },

    gmap: {
        map: null,
        markers: [],
        open_window: null,
        display_detail_info: false,
        watch_id: null,
        now_geo_marker: null,

        setMapStyle: function() {
            if (tootMap.gmap.display_detail_info) {
                tootMap.gmap.map.setMapTypeId(google.maps.MapTypeId.ROADMAP);
            } else {
                tootMap.gmap.map.setMapTypeId("simple_map");
            }
        },
        selectText: function() {
            if (tootMap.api.access_token==null) {
                document.getElementById('click-position').focus();
                document.getElementById('click-position').select();
                document.getElementById('click-position').setSelectionRange(0, 999);
            }
        },
        // マーカを作成し地図に表示
        createMarker: function(position, content, icon, flag) {
            content = typeof(content)=="undefined"?null:content;
            icon = typeof(icon)=="undefined"?"./biwakomap-icon.png":icon;
            flag = typeof(flag)=="undefined"?false:flag;
            var marker = new google.maps.Marker({
                position: position,
                map: tootMap.gmap.map,
                icon: {
                    url: icon
                }
            });
            if (content!=null) {
                var info_window = new google.maps.InfoWindow({
                    content: content
                });
                marker.addListener('click', function(e){
                    if (tootMap.gmap.open_window) {
                        tootMap.gmap.open_window.close();
                    }
                    info_window.open(tootMap.gmap.map, marker);
                    tootMap.gmap.open_window = info_window;
                    tootMap.gmap.map.setCenter(marker.position);
                    if (flag) {
                        document.getElementById('click-position').focus();
                        document.getElementById('click-position').select();
                        document.getElementById('click-position').setSelectionRange(0, 999);
                    }
                });
            }
            return marker;
        },
        clearMarkers: function() {
            for (var i in tootMap.gmap.markers) {
                tootMap.gmap.markers[i].setMap(null);
            }
            tootMap.gmap.markers = [];
        },
        // 地図を表示
        display: function() {
            tootMap.gmap.map = new google.maps.Map(document.getElementById('map'), {
                zoom: tootMap.params.zoom,
                center: {lat: tootMap.params.lat, lng: tootMap.params.lng},
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
            tootMap.gmap.map.mapTypes.set("simple_map", simple_map_style);
            tootMap.gmap.setMapStyle();
        },
        // 現在位置のマーカを表示する（無ければ無印マーカ）
        displayPositionMarker: function(latLng) {
            just_marker=null;
            for( i=0;i<tootMap.gmap.markers.length; i++ ) {
                if(tootMap.gmap.markers[i].position.equals(latLng)) {
                    just_marker = tootMap.gmap.markers[i];
                    break;
                }
            }
            if (just_marker) {
                google.maps.event.trigger(just_marker, 'click');
            } else {
                new google.maps.Marker({
                    position: tootMap.gmap.map.getCenter(),
                    map: tootMap.gmap.map,
                    icon: './nowgeo-icon.png'
                });
            }
        },
        mappingText: function(latLng) {
            return "https://" + tootMap.map_domain + '?lat=' + latLng.lat() + '&lng=' + latLng.lng()
            + '&zoom=' + tootMap.gmap.map.zoom
            + '&tag=' + encodeURI(tootMap.params.tag)
            + ' #' + tootMap.params.tag;
        },
        createContent: function(latLng) {
            var content = '<p>この位置についてトゥートする時にコピペしてください</p>'
                + '<textarea cols="30" rows="5" id="click-position" readonly>'+tootMap.gmap.mappingText(latLng)+'</textarea>';
            if (tootMap.api.access_token!=null) {
                var attamchments = "";
                var i = 0;
                tootMap.api.media_urls.forEach(function(url) {
                    attamchments += '<div class="media-item" id="media-'+tootMap.api.media_ids[i]+'"><a style="background-image: url('+url+')" target="_blank" rel="noopener" class="u-photo" href="'+url+'"></a><button class="icon-button" media_id="'+tootMap.api.media_ids[i]+'"><i class="fa fa-fw fa-times" aria-hidden="true" style="transform: rotate(0deg);"></i></button></div>';
                    i++;
                });
                content = '<div class="detailed-status light"><a class="detailed-status__display-name p-author h-card" rel="noopener" target="_blank" href="">'
                    + '<div class="avatar"><img src="'+tootMap.api.avatar_icon+'" height="48px" /></div>'
                    + '<span class="display-name"><span>'+tootMap.api.username+'@'+tootMap.mstdn_domain+'</span></span></a>'
                    + '<textarea cols="30" rows="5" id="status"></textarea>'
                    + '<div><p class="btn btn-primary" id="toot">公開Toot</p>　<p class="btn btn-primary" id="media"><i class="fa fa-camera" aria-hidden="true"></i></p><input type="file" name="media"></div>'
                    + '<div class="status__attachments__inner" id ="attachments">'
                    + attamchments
                    + '</div>'
                    + '</div>';
            }
            return content;
        },
        // 現在位置情報の表示
        showInfoWindow: function(latLng, content) {
            if (tootMap.gmap.open_window) {
                tootMap.gmap.open_window.close();
            }
            var info_window=new google.maps.InfoWindow();
            info_window.setContent(content);
            info_window.setPosition(latLng);
            info_window.open(tootMap.gmap.map);
            tootMap.gmap.open_window = info_window;
        },
        // 現在位置をマップ内に表示
        showNowGeo: function() {
            if (navigator.geolocation) {
                tootMap.gmap.watch_id = navigator.geolocation.getCurrentPosition(
                    function (pos) {
                        var now_geo = new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude);
                        var zoom = tootMap.gmap.map.zoom < 13 ? 13 : tootMap.gmap.map.zoom;
                        tootMap.gmap.map.setZoom(zoom);
                        tootMap.gmap.map.setCenter(now_geo);
                        if (tootMap.gmap.now_geo_marker!=null) {
                            tootMap.gmap.now_geo_marker.setMap(null);
                        }
                        if (tootMap.api.access_token!=null) {
                            var content = tootMap.gmap.createContent(now_geo);
                        } else {
                            var content = null;
                        }
                        var flg = tootMap.api.access_token==null;
                        tootMap.gmap.now_geo_marker = tootMap.gmap.createMarker(now_geo, content, './nowgeo-icon.png', flg);
                        google.maps.event.trigger(tootmap.gmap.now_geo_marker, 'click');
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
                alert("このブラウザではGeolocationが使えません");
            }
        }
    },

    api: {
        access_token: localStorage.getItem('access_token') ? localStorage.getItem('access_token') : null,
        avatar_icon: localStorage.getItem('avatar_icon') ? localStorage.getItem('avatar_icon') : "missing.png",
        username: localStorage.getItem('username') ? localStorage.getItem('username') : null,
        media_urls: [],
        media_ids: [],
        client_id: localStorage.getItem('client_id') ? localStorage.getItem('client_id') : null,
        client_secret: localStorage.getItem('client_secret') ? localStorage.getItem('client_secret') : null,
        code: localStorage.getItem('code') ? localStorage.getItem('code') : null,

        openAuthWindow: function() {
            if (tootMap.api.code==null) {
                location.href = "https://"+tootMap.mstdn_domain+"/oauth/authorize?"+"client_id="+tootMap.api.client_id+"&response_type=code&redirect_uri=https://"+tootMap.map_domain+"&scope=read%20write";
            }
        },
        getClientInfo: function() {
            var url = "https://"+tootMap.mstdn_domain+"/api/v1/apps";
            var data = {client_name: tootMap.client_name, redirect_uris: "https://"+tootMap.map_domain, scopes: 'read write'};
            var xhr = new XMLHttpRequest();
            xhr.onreadystatechange = function() {
                if (this.readyState == 4 && this.status == 200) {
                    if (this.responseText.length == 0) {
                        tootMap.api.getClientInfo();
                    } else {
                        var arr = JSON.parse(this.responseText);
                        if (typeof(arr['client_id']) != "undefined") {
                            tootMap.api.client_id = arr['client_id'];
                            localStorage.setItem('client_id', tootMap.api.client_id);
                        }
                        if (typeof(arr['client_secret']) != "undefined") {
                            tootMap.api.client_secret = arr['client_secret'];
                            localStorage.setItem('client_secret', tootMap.api.client_secret);
                        }
                        tootMap.api.openAuthWindow();
                    }
                }
            };
            xhr.open("POST", url, true);
            xhr.setRequestHeader("Content-Type", "application/json");
            xhr.send(JSON.stringify(data));
        },
        getAccessToken: function() {
            var url = "https://"+tootMap.mstdn_domain+"/oauth/token";
            var data = {grant_type: "authorization_code", redirect_uri: "https://"+tootMap.map_domain, client_id: tootMap.api.client_id, client_secret: tootMap.api.client_secret, code: tootMap.params.code};
            var xhr = new XMLHttpRequest();
            xhr.onreadystatechange = function() {
                if (this.readyState == 4 && this.status == 200) {
                    if (this.responseText.length == 0) {
                        tootMap.api.getAccessToken();
                    } else {
                        var arr = JSON.parse(this.responseText);
                        if (typeof(arr['access_token']) != "undefined") {
                            tootMap.api.access_token = arr['access_token'];
                            localStorage.setItem('access_token', tootMap.api.access_token);
                        }
                        tootMap.api.getInfo();
                    }
                }
            };
            xhr.open("POST", url, true);
            xhr.setRequestHeader("Content-Type", "application/json");
            xhr.send(JSON.stringify(data));
        },
        getInfo: function() {
            if (tootMap.api.avatar_icon=="missing.png") {
                var url = "https://"+tootMap.mstdn_domain+"/api/v1/accounts/verify_credentials";
                var xhr = new XMLHttpRequest();
                xhr.onreadystatechange = function() {
                    if (this.readyState == 4 && this.status == 200) {
                        if (this.responseText.length == 0) {
                            tootMap.api.getInfo();
                        } else {
                            var arr = JSON.parse(this.responseText);
                            if (typeof(arr['avatar']) != "undefined") {
                                tootMap.api.avatar_icon = arr['avatar'];
                                localStorage.setItem('avatar_icon', tootMap.api.avatar_icon);
                            }
                            if (typeof(arr['username']) != "undefined") {
                                tootMap.api.username = arr['username'];
                                localStorage.setItem('username', tootMap.api.username);
                            }

                            $("#loginDiv").addClass("hidden");
                            $("#login").addClass("hidden");
                            $("#avatarIcon").attr("src", tootMap.api.avatar_icon);
                            $("#logout").removeClass("hidden");
                        }
                    }
                };
                xhr.open("GET", url, true);
                xhr.setRequestHeader("Authorization","Bearer "+tootMap.api.access_token);
                xhr.send();
            } else {
                $("#loginDiv").addClass("hidden");
                $("#login").addClass("hidden");
                $("#avatarIcon").attr("src", tootMap.api.avatar_icon);
                $("#logout").removeClass("hidden");
            }
        },
        toot: function(status) {
            if (tootMap.api.access_token!=null) {
                var url = "https://"+tootMap.mstdn_domain+"/api/v1/statuses";
                var data = {status: status, visibility: 'public', media_ids: tootMap.api.media_ids};
                var xhr = new XMLHttpRequest();
                xhr.onreadystatechange = function() {
                    if (this.readyState == 4 && this.status == 200) {
                        var arr = JSON.parse(this.responseText);

                        tootMap.gmap.open_window.close();
                        tootMap.api.media_ids = [];
                        tootMap.api.media_urls = [];
                        var toot = tootMap.timeline.setupToot(arr);
                        tootMap.gmap.markers.push(tootMap.gmap.createMarker(toot['position'], toot['innerHTML']));
                    }
                };
                xhr.open("POST", url, true);
                xhr.setRequestHeader("Content-Type", "application/json");
                xhr.setRequestHeader("Authorization","Bearer "+tootMap.api.access_token);
                xhr.send(JSON.stringify(data));
            } else {
                alert("アカウント連携情報がありません");
            }
        },
        mediaUpload: function(file) {
            if (tootMap.api.access_token!=null) {
                var data = new FormData();
                data.append("file", file);
                var url = "https://"+tootMap.mstdn_domain+"/api/v1/media";
                var xhr = new XMLHttpRequest();
                xhr.onreadystatechange = function() {
                    if (this.readyState == 4 && this.status == 200) {
                        var arr = JSON.parse(this.responseText);

                        tootMap.hideMediaLoader();
                        var url = arr["preview_url"];
                        var id = arr["id"];
                        $("#attachments").append('<div class="media-item" id="media-'+id+'"><a style="background-image: url('+url+')" target="_blank" rel="noopener" class="u-photo" href="'+url+'"></a><button class="icon-button" media_id="'+id+'"><i class="fa fa-fw fa-times" aria-hidden="true" style="transform: rotate(0deg);"></i></button></div>');
                        tootMap.api.media_ids.push(id);
                        tootMap.api.media_urls.push(url);
            
                    }
                };
                xhr.open("POST", url, true);
                xhr.setRequestHeader("Authorization","Bearer "+tootMap.api.access_token);
                xhr.send(data);
            } else {
                alert("アカウント連携情報がありません");
            }
        }
    },

    // 最終取得トゥートの時間を表示
    getFormatDate: function(date) {
        if (isNaN(date)) { return ''; }
        var y = date.getFullYear();
        var m = date.getMonth() + 1;
        var d = date.getDate();
        var h = date.getHours();
        var M = date.getMinutes();
        var s = date.getSeconds();

        return y + '/' + m + '/' + d + ' ' + h + ':' + M + ':' + s;
    },
    // メニューを初期化
    createMenuDiv: function() {
        var date = new Date(tootMap.timeline.last_date);
        $("#setting").html(
            "<a class='btn btn-block btn-light' id='MapButton' href='#'>マップに戻る</a>"
            + "<a class='btn btn-block btn-light' id='detailInfo' href='#'>地図の詳細情報を表示"+(tootMap.gmap.display_detail_info?"しない":"する")+"</a>"
            + "<a class='btn btn-block btn-light' id='nowgeo' href='#'>現在位置を表示</a>"
            + "<div class='btn btn-block btn-light'>タグ：　#<input type='text' id='tag' value='"+tootMap.params.tag+"'></div>"
            + "<a class='btn btn-block btn-light' id='past-tagtl' href='#'>過去のトゥートを取得<br />("+tootMap.getFormatDate(date)+"以前)</a>"
            + "<a class='btn btn-block btn-light' id='tagtl' href='https://"+tootMap.mstdn_domain+"/tags/"+tootMap.params.tag+"' target='_blank'>このタグの公開タイムライン</a>"
            + "<a class='btn btn-block btn-light' target='_blank' href='https://biwakodon.com/about/more#tootmap'>使い方はこちら</a>"
            + "<div class='btn btn-block btn-light "+(tootMap.api.access_token==null?"":"hidden")+"' id='loginDiv'>連携ドメイン： https://<input type='text' id='domain' value='"+tootMap.mstdn_domain+"'></div>"
            + "<a class='btn btn-block btn-light "+(tootMap.api.access_token==null?"":"hidden")+"' id='login' href='#'>アカウント連携</a>"
            + "<a class='btn btn-block btn-light "+(tootMap.api.access_token!=null?"":"hidden")+"' id='logout' href='#'><img id='avatarIcon' src='"+tootMap.api.avatar_icon+"' height='46px' />アカウント連携解除</a>"
        );
        var div = document.createElement('div');
        div.index = 1;
        div.innerHTML = (tootMap.api.avatar_icon!="missing.png"?"<img id='avatarIcon' src='"+tootMap.api.avatar_icon+"' height='38px' />":"")+"<a class='btn btn-light' id='MenuButton' href='#'><span id='tagspan'>#"+tootMap.params.tag+"</span></a>";
        return div;
    },

    displayLoader: function() {
        $('#loading-bg').height($(window).height()).css('display','block');
        $('#loading').height($(window).height()).css('display','block');
    },
    hideLoader: function() {
        $('#loading-bg').delay(600).fadeOut(300);
        $('#loading').delay(600).fadeOut(300);
    },
    showMediaLoader: function() {
        $("#attachments").show();
        $("#attachments").append('<div class="media-item media-loader"><a href="#"><img src="./loading.gif"  /></a></div>');
    },
    hideMediaLoader: function() {
        $(".media-loader").hide();
    },
    hideMediaArea: function() {
        $("#attachments").hide();
    },
    showMenu: function() {
        $("#map").hide();
        $("#setting").show();
    },
    showMap: function() {
        $("#setting").hide();
        $("#map").show();
    },
    changeDetail: function() {
        tootMap.gmap.display_detail_info = !tootMap.gmap.display_detail_info;
        tootMap.gmap.setMapStyle();
        $('#detailInfo').html("地図の詳細情報を表示"+(tootMap.gmap.display_detail_info?"しない":"する"));
        tootMap.showMap();
    },

    displayModal: function() {
        $("body").append('<div id="modal-bg"></div>');
        $("#modal-tag").val(tootMap.params.tag);
        tootMap.modalResize();
        $("#modal-bg,#login-modal").fadeIn("slow");
        $(window).resize(tootMap.modalResize);
    },
    modalResize: function() {
        var w = $(window).width();
        var h = $(window).height();
        var cw = $("#login-modal").outerWidth();
        var ch = $("#login-modal").outerHeight();
        $("#login-modal").css({
            "left": ((w - cw)/2) + "px",
            "top": ((h - ch)/2) + "px"
        });
    },

    initialize: function() {
        tootMap.params.get();
        tootMap.gmap.display();

        if (tootMap.modal_flg==null) {
            tootMap.displayModal();
        } else {
            tootMap.timeline.get();
            if (tootMap.params.code!=null) {
                tootMap.api.getAccessToken();
            }
        }
        tootMap.gmap.map.controls[google.maps.ControlPosition.LEFT_TOP] = [tootMap.createMenuDiv()];
        
        $("body").on("click", "#MenuButton", tootMap.showMenu);
        $("body").on("click", "#MapButton", tootMap.showMap);
        $("body").on('click', '#detailInfo', tootMap.changeDetail);
        google.maps.event.addListener(tootMap.gmap.map, 'click', function(e) {
            if (tootMap.api.access_token!=null) {
                var content = tootMap.gmap.createContent(e.latLng);
                tootMap.gmap.showInfoWindow(e.latLng, content);
                tootMap.gmap.selectText();
                $('#status').twemojiPicker({
                    width: '95%'
                });
            }
        });
        $("body").on('click', '#past-tagtl', function() {
            tootMap.timeline.get();
            tootMap.showMap();
        });
        $("body").on('click', '#nowgeo', function() {
            tootMap.gmap.showNowGeo();
            tootMap.showMap();
        });
        $("body").on('change', '#tag', function() {
            tootMap.gmap.clearMarkers();
            tootMap.timeline.clear();
            tootMap.params.tag = this.value;
            localStorage.setItem("default_tag", tootMap.params.tag);
            $('#tagspan').text("#"+tootMap.params.tag);
            $('#tagtl').attr("href", "https://"+tootMap.mstdn_domain+"/tags/"+tootMap.params.tag);
            tootMap.timeline.get();
            tootMap.showMap();
        });
        $("body").on('click', '#login', function() {
            if (tootMap.mstdn_domain!="") {
                localStorage.setItem("mstdn_domain", tootMap.mstdn_domain);
                tootMap.api.getClientInfo();
            } else {
                alert("連携ドメインを入力してください");
            }
            return false;
        });
        $("body").on('click', '#logout', function() {
            localStorage.clear();
            location.href = "https://"+tootMap.map_domain;
        });
        $("body").on('change', '#domain, #modal-domain', function() {
            tootMap.mstdn_domain = this.value.replace(/[^0-9a-z\.]/gi, '');
            this.value = tootMap.mstdn_domain;
        });
        $("body").on('click', '#toot', function() {
            var status = $("#status").val();
            status = tootMap.removeHTMLTag(status);
            status += "\n"+tootMap.gmap.mappingText(tootMap.gmap.open_window.getPosition());
            tootMap.api.toot(status);
        });
        $("body").on('click', '#media', function() {
            if (tootMap.api.media_ids.length >= 4) {
                alert("添付できるファイルは4つまでです");
            } else {
                $("input[type=file]").click();
            }
        });
        $("body").on("change", 'input[type=file]', function() {
            tootMap.showMediaLoader();
            tootMap.api.mediaUpload(this.files[0]);
        });
        $("body").on("click", ".icon-button", function() {
            var media_id = this.getAttribute("media_id");
            $("#media-"+media_id).remove();
            i = tootMap.api.media_ids.indexOf(media_id);
            tootMap.api.media_ids.splice(i, 1);
            tootMap.api.media_urls.splice(i, 1);
        });
        $("body").on("click", "#no-login",function() {
            localStorage.setItem('modal_flg', 1);
            $("#login-modal,#modal-bg").fadeOut("slow",function(){
                $('#modal-bg').remove();
                tootMap.params.tag = $("#modal-tag").val();
                localStorage.setItem("default_tag", tootMap.params.tag);
                $('#tagspan').text("#"+tootMap.params.tag);
                $('#tagtl').attr("href", "https://"+tootMap.mstdn_domain+"/tags/"+tootMap.params.tag);
                $('#tag').val(tootMap.params.tag);
                tootMap.timeline.get();
                if (tootMap.params.code!=null) {
                    tootMap.api.getAccessToken();
                }
            });
        });
        $("body").on("click", "#modal-login-btn", function() {
            if (tootMap.mstdn_domain!="") {
                localStorage.setItem('modal_flg', 1);
                localStorage.setItem("mstdn_domain", tootMap.mstdn_domain);
                tootMap.api.getClientInfo();
            } else {
                alert("連携ドメインを入力してください");
            }
        });
    }
};