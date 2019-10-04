/**
 * B"H
 * Created by deren 10/29/13.
 */
var reCaptchaKey = '6LeaxSQTAAAAAO4kFlzi78SSKRcJDQfMm9AcXuLV';

function decodeEntities(encodedString) {
    if (typeof encodedString != "string") return encodedString;
    if (!encodedString) return "";
    var textArea = document.createElement('textarea');
    textArea.innerHTML = encodedString;
    return textArea.value;
}

var QueryString = function() {
    var query_string = {};
    var query = window.location.search.substring(1);
    var vars = query.split("&");
    for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split("=");
        if (typeof query_string[pair[0]] === "undefined") {
            query_string[pair[0]] = decodeURIComponent(pair[1]);
        } else if (typeof query_string[pair[0]] === "string") {
            var arr = [query_string[pair[0]], decodeURIComponent(pair[1])];
            query_string[pair[0]] = arr;
        } else {
            query_string[pair[0]].push(decodeURIComponent(pair[1]));
        }
    }
    return query_string;
}();
var Simbla = (function() {
    if (!window['Parse'])
        return;
    var _simbla = Parse;
    //support old version of parse.
    if (_simbla.Object.prototype.validate.toString().indexOf('g-recaptcha') == -1)
        _simbla.Object.prototype.validate = function(e) {
            if (e.hasOwnProperty("ACL") && !(e.ACL instanceof A["default"])) return new I["default"](I["default"].OTHER_CAUSE, "ACL must be a Parse ACL.");
            for (var t in e)
                if (!/^[A-Za-z][0-9A-Za-z_]*$/.test(t) && t != "g-recaptcha-response") return new I["default"](I["default"].INVALID_KEY_NAME);
            return !1
        };
    var _appId;


    function setCookie(t, cb) {
        $.post('/simblaParseCk', { app: _appId, t: t }, cb);
    }


    var _init = _simbla.initialize;
    _simbla.initialize = function() {
        _init.apply(this, arguments);
        _appId = arguments[0];

    };

    var _siup = _simbla.User.signUp;
    _simbla.User.signUp = function(a, c) {
        var p = _siup(a);
        var prom = new Parse.Promise();
        p.then(function() {
            if (_simbla.User.current());
            setCookie(_simbla.User.current().getSessionToken(), function() {
                prom.resolve(_simbla.User.current());
                if (c && c.success)
                    c.success(_simbla.User.current());

            });
        }, function(err) {
            prom.reject(err);
            if (c && c.error)
                c.error(null, err);
        });
        //return p;
        return prom;
    };

    var _login = _simbla.User.logIn;
    _simbla.User.logIn = function(a, b, c) {

        var p = _login(a, b);
        var prom = new Parse.Promise();

        p.then(function() {

            if (_simbla.User.current());
            setCookie(_simbla.User.current().getSessionToken(), function() {

                prom.resolve(_simbla.User.current());
                if (c && c.success)
                    c.success(_simbla.User.current());

            });
        }, function(err) {
            prom.reject(err);
            if (c && c.error)
                c.error(null, err);
        });
        return prom;

    };

    var _logout = _simbla.User.logOut;
    _simbla.User.logOut = function() {
        var prom = new Parse.Promise();

        var p = _logout.apply(this, arguments);
        p.then(function() {
            if (!_simbla.User.current())
                setCookie("", function() {
                    prom.resolve();
                });
        }, function(err) {
            setCookie("");
            prom.reject(err);

        });
        return prom;

    };
    _simbla.User.mypermissions = function() {
        return Simbla._request('GET', 'users/mypermissions')
    }
    _simbla.Query.prototype.aggregate = function(groupby, group, groupcomplex) {
        if (arguments.length == 0) return console.error("missing groupby param");
        if (arguments.length == 1) return console.error("missing group param");
        if (typeof group != "object") return console.error("group must be an object");
        //if (Object.keys(group).length != 1) return console.error("the computed aggregate must specify exactly one operator")
        for (var key in group) {
            if (typeof group[key] == "object" && !groupcomplex)
                return console.error('the group aggregate field ' + key + ' must be a string');

        }
        var limit = this._limit;
        if (limit <= 0) limit = null;
        var d = { where: this._where, groupby: groupby, limit: limit };
        d[groupcomplex ? 'groupcomplex' : 'group'] = group;


        return Simbla._request('GET', 'classes-aggregate/' + this.className, d);
    }
    var appData = $('meta[name="simbla"]');
    _simbla.initialize(appData.attr('app'), appData.attr('key'));
    _simbla.serverURL = appData.attr('server');
    return _simbla;

})();
var TextKeys = ['Name', 'name', 'Key', 'key'];

function getTextKeyValue(o) {
    var val;
    TextKeys.some(function(k) {
        if (o.get(k)) {
            val = o.get(k);
            return true;
        }
    });
    return val;
}

function simblaLogin(form) {
    var T = $(form);
    T.find('.simbla-form').remove();

    var spin = $('<div class="simbla-form"><i class="simbla-loader-min"></i></div>');
    T.append(spin);

    Simbla.User.logIn(form.username.value, form.password.value).then(
        function(user) {

            spin.remove();
            var location;

            if (QueryString.redirectTo)
                location = QueryString.redirectTo;
            else if (T.attr('data-next-page'))
                location = $('meta[name="page-source"]').attr('site') + "/" + T.attr('data-next-page');
            if (location)
                window.location = location;
        },
        function(error) {
            spin.remove();
            T.append('<div class="text-danger simbla-form"><label>' + error.message + '</label></div>');
            // The login failed. Check error to see why.
        }
    );

    return false;

}

function simblaRegister(form) {
    var T = $(form);

    T.find('.simbla-form').remove();

    if (form.password.value != form.confirmpassword.value) {
        T.append('<div class="text-danger simbla-form"><label>Password don\'t match confirm password</label></div>');

        return false;
    }
    var spin = $('<div class="simbla-form"><i class="simbla-loader-min"></i></div>');
    T.append(spin);


    var user = new Simbla.User();
    user.set("username", form.username.value);
    user.set("email", form.username.value);
    user.set("name", form.name.value);

    user.set("password", form.password.value);

    if (form.phone && form.phone.value)
        user.set("phone", form.phone.value);
    if (form.address && form.address.value)
        user.set("address", form.address.value);

    if (form["g-recaptcha-response"] && form["g-recaptcha-response"].value)
        user.set("g-recaptcha-response", form["g-recaptcha-response"].value, {
            error: function(err, a) {
                console.log(err, a);
            }
        });

    user.signUp(null, {
        success: function(user) {
            spin.remove();
            var location;
            if (QueryString.redirectTo)
                window.location = QueryString.redirectTo;
            else if (T.attr('data-success-type') == "link" && T.attr('data-success'))
                window.location = T.attr('data-success');
            else if (T.attr('data-success-type') == "text")
                T.append('<div class="text-success simbla-form"><label>' + T.attr('data-success') + '</label></div>')

        },
        error: function(user, error) {

            spin.remove();
            T.append('<div class="text-danger simbla-form"><label>' + error.message + "<br />" + T.attr('data-failure') + '</label></div>');
            if (error.message.indexOf("CAPTCHA") > -1)
                grecaptcha.reset(T.data('captcha'));
        }
    });


    return false;
}

function simblaRestorePassword(e) {
    var T = $(e.target).closest('form');
    var form = T[0];
    T.find('.simbla-form').remove();

    if (!form.username.validity.valid) {

        T.find(':submit').trigger('click');
        return;

    }
    var spin = $('<div class="simbla-form"><i class="simbla-loader-min"></i></div>');
    T.append(spin);
    Simbla.User.requestPasswordReset(form.username.value, {
        success: function() {
            spin.remove();
            T.append('<div class="text-success simbla-form"><label>Password restored Email sent successfully</label></div>')

        },
        error: function(error) {
            spin.remove();
            T.append('<div class="text-danger simbla-form"><label>' + error.message + '</label></div>');

        }
    });
}

function createSimblaObj(form) {
    function error(e) {
        var errorMessage = "";
        if (e.length)
            e.forEach(function(e) {
                errorMessage += (e.message || e.error) + "<br />";
            });
        else
            errorMessage += (e.message || e.error) + "<br />";
        spin.remove();
        T.append('<div class="text-danger simbla-form"><label>' + errorMessage + (T.data('failure') || "") + '</label></div>')
        if (e.message.indexOf('CAPTCHA') != -1)
            grecaptcha.reset(T.data('captcha'));
    }


    var T = $(form);
    T.find('.conversation-input').next().trigger('click');
    T.find('.simbla-form').remove();
    var spin = $('<div class="simbla-form"><i class="simbla-loader-min"></i></div>');
    T.append(spin);

    var cls = T.data('simbla-class');
    if (!cls) {
        error({ message: "Simbla class not defined" });
        return false;
    }

    var serialize = T.serializeArray();

    var obj = T.data('val') || new(Simbla.Object.extend(cls));
    serialize.forEach(function(e) {
        var name = e.name;
        var value = e.value;
        var elem = form[name];
        var type = elem.type;
        if (type == undefined) {
            elem = form[name][0];
            type = elem.type;
        }
        //check if is FF and date input.
        if (type == "text" && $(elem).attr('type') == 'date') type = 'date';
        switch (type) {
            case 'select-one':
                if ($(elem).hasClass('select-pointer')) {
                    if (!value) value = null;
                    else {
                        var p = new(Simbla.Object.extend($(elem).attr('targetclass')));
                        p.id = value;
                        value = p;
                    }
                }
                break;
            case 'checkbox':
                value = !!value;
                break;
            case 'date':
                value = value ? new Date(value) : undefined;
                break;
            case 'number':
                value = value != "" ? Number(value) : undefined;
                break;

        }

        obj.set(name, value);
    });
    T.find('select[disabled]').each(function() {
        if ($(this).val()) {
            var value = $(this).val();
            if ($(this).hasClass('select-pointer')) {
                var p = new(Simbla.Object.extend($(this).attr('targetclass')));
                p.id = value;
                value = p;
            }
            obj.set($(this).attr('name'), value);
        }
    });
    T.find('[type="checkbox"]').not(':checked').each(function() {
        obj.set(this.name, false);
    });

    function save() {
        $(document).trigger('simblaobjectbeforesave', {
            obj: obj,
            form: T,
            cls: cls
        })
        obj.save().then(function() {
            try {
                if (window.opener.refreshTable) {
                    window.opener.refreshTable();
                    window.close();
                    return;
                }
            } catch (e) {

            }
            T.data('table') && T.data('table').trigger('refresh');
            if (T.closest('.simbla-table').length == 1) {

                T.fadeOut(T.remove);
                if (T.closest('.simbla-table').find('.table-responsive').is(':hidden')) {
                    T.closest('.simbla-table').find('.table-responsive, .paging-area, .db-form-add').fadeIn();
                }
                return;
            } else {
                T.closest('.modal').modal('hide');
            }



            spin.remove();

            T.append('<div class="text-success simbla-form"><label>' + (T.data('success') || "") + '</label></div>')
            form.reset();
            T.find('.wysiwyg-editor').each(function() {
                $(this).sceditor('instance').val("");
            });
            grecaptcha.reset(T.data('captcha'));

        }, error);
    }

    var fileInputs = T.find('input[type="file"]');
    if (fileInputs.length > 0) {
        var promises = [];

        fileInputs.each(function() {
            var input = this;
            if ($(input).data('file'))
                return obj.set(input.name, $(input).data('file'));

            if (input.files.length > 0) {
                var p = new Simbla.Promise();
                var file = new Simbla.File(encodeURIComponent(this.files[0].name), this.files[0]);
                file.save().then(function() {
                    $(input).data('file', file).on('change', function() {
                        $(this).removeData('file')
                    });
                    obj.set(input.name, file);
                    p.resolve();
                }, function(res) {
                    p.reject(JSON.parse(res.responseText));
                    //error({message: JSON.parse(res.responseText).error});
                });


                promises.push(p);
            }

        });
        Simbla.Promise.when(promises).then(save, error);


    } else
        save();

    return false;
}
var dateOptions = {
    "year ago": 0,
    "beginning of this year": 1,
    "30 days period": 2,
    "beginning of this month": 3,
    "today": 4,
    "end of this month": 5,
    "end of next month": 6,
    "end of this year": 7,
    "year ahead": 8
};

function dateManipulate(val) {

    var d = new Date();
    d.setHours(0, 0, 0, 0);
    if (val && !isNaN(val))
        val = Number(val);

    if (typeof val === "number") {
        d.setDate(d.getDate() + val)
    } else
        switch (dateOptions[val]) {
            case 0:
                d.setFullYear(d.getFullYear() - 1);
                break;
            case 1:
                d.setDate(1);
                d.setMonth(0);
                break;
            case 2:
                d.setMonth(d.getMonth() - 1);
                break;
            case 3:
                d.setDate(1);
                break;
            case 4:
                break;
            case 5:
                d.setMonth(d.getMonth() + 1);
                d.setDate(1);
                d.setMilliseconds(-1);
                break;
            case 6:
                d.setMonth(d.getMonth() + 2);
                d.setDate(1);
                d.setMilliseconds(-1);
                break;
            case 7:
                d.setFullYear(d.getFullYear() + 1);
                d.setMonth(0);
                d.setDate(1);
                d.setMilliseconds(-1);
                break;
            case 8:
                d.setFullYear(d.getFullYear() + 1);
                break;
            default:
                return new Date(val);

        }
    return d;

}

function addCriteriaToQuery(q, cls, o) {

    function addCriteria(c, f, v, tc) {
        // call the criteria as function with values of fields name and fields value.
        // if this field already in query constraint, create temp
        // query and extract the where into the existing where.
        if (tc) {

            var p = new(Simbla.Object.extend(tc));
            p.id = v;
            v = p;
        }
        var fieldWhere = q._where[f];
        if (!fieldWhere)
            q[c](f, v);
        else if (typeof fieldWhere == "string") {
            return console.error("cannot add constraint after equal query");
        } else {
            var tQuery = new Simbla.Query(cls);
            tQuery[c](f, v);

            var tWere = tQuery._where[f];
            if (typeof tWere == "string") {
                return console.error("cannot add constraint of equal to existing where query");
            }
            var tKey = Object.keys(tWere)[0];
            if (fieldWhere[tKey]) {
                return console.error("constraint already exists");
            }
            fieldWhere[tKey] = tWere[tKey];
        }

        var reg = q._where[f].$regex;
        if (reg) {
            q._where[f].$options = 'i';
        }

    }

    var clsPointers = o.data('classPointers')
    if (clsPointers) {
        for (var i in clsPointers) {
            if (clsPointers[i] == QueryString.cls && QueryString.oid) {
                addCriteria("equalTo", i, QueryString.oid, QueryString.cls);
            }
        }
    }

    if (o.data('query') == 'hard-code') {
        var criteria = o.data('criteria') || [];
        criteria.forEach(function(f) {
            if (f.T == "Date" && !(f.V instanceof Date))
                f.V = dateManipulate(f.V);
            addCriteria(f.C, f.F, f.V, f.P && f.P.targetClass);

        });
    } else if (o.data('query') == "form" && o.data('query-form')) {
        var form = $('.dbFormQuery[name="' + o.data('query-form') + '"]');
        if (form.length == 1) {
            form.find('input, select, textarea').each(function() {
                var i = $(this);
                if (i.data('criteria')) {
                    var val = i.val();
                    if (i.is(':checkbox'))
                        val = i.is(':checked') ? true : undefined;
                    else if (i.is('[type="number"]'))
                        val = parseFloat(val);
                    else if (i.is('[type="date"]') && val) {
                        val = new Date(val);
                    } else if (i.is('select.select-pointer') && !val && i.attr('val'))
                        val = i.attr('val')

                    if (val !== undefined && val !== "" && (typeof val != "number" || !isNaN(val))) {

                        addCriteria(i.data('criteria'), i.attr('name'), val, i.is('.select-pointer') && i.attr('targetclass'));

                    }
                }
            })
        }
    }

    return q;
}

function checkFormInitialVal(o) {

    if (o.data('query') == "form") {
        if (o.data('query-form')) {
            var form = $('.dbFormQuery[name="' + o.data('query-form') + '"]');
            if (form.length == 1) {

                if (form.find('input[value=""], select[value=""], textarea[value=""]').length > 0) {
                    return false;
                }
            } else {
                console.error("Form not fount");
                return false
            }
        } else {
            console.error("Form not selected");
            return false;
        }
    } else
        return true;
}
window["Chart"] && Chart.scaleService.updateScaleDefaults('linear', {
    ticks: {
        suggestedMin: 0
    }
});
var ChartThemes = {
    icecream: ['rgba(230, 217, 255, 1)', 'rgba(219, 242, 242, 1)', 'rgba(215, 236, 251, 1)', 'rgba(255, 224, 230, 1)', 'rgba(255, 236, 217, 1)', 'rgba(255, 243, 214, 1)'],
    icecream_opacity: ['rgba(230, 217, 255, 0.2)', 'rgba(219, 242, 242, 0.2)', 'rgba(215, 236, 251, 0.2)', 'rgba(255, 224, 230, 0.2)', 'rgba(255, 236, 217, 0.2)', 'rgba(255, 243, 214, 0.2)'],
    rainyday: ['rgba(235, 235, 235, 1)', 'rgba(204, 204, 204, 1)', 'rgba(172, 172, 172, 1)', 'rgba(125, 125, 125, 1)', 'rgba(70, 70, 70, 1)', 'rgba(37, 37, 37, 1)'],
    rainyday_opacity: ['rgba(235, 235, 235, 0.2)', 'rgba(204, 204, 204, 0.2)', 'rgba(172, 172, 172, 0.2)', 'rgba(125, 125, 125, 0.2)', 'rgba(70, 70, 70, 0.2)', 'rgba(37, 37, 37, 0.2)'],
    bluesky: ['rgba(200, 232, 249, 1)', 'rgba(152, 207, 235, 1)', 'rgba(116, 186, 221, 1)', 'rgba(105, 178, 214, 1)', 'rgba(79, 157, 193, 1)', 'rgba(75, 133, 163, 1)'],
    bluesky_opacity: ['rgba(200, 232, 249, 0.2)', 'rgba(152, 207, 235, 0.2)', 'rgba(116, 186, 221, 0.2)', 'rgba(105, 178, 214, 0.2)', 'rgba(79, 157, 193, 0.2)', 'rgba(75, 133, 163, 0.2)'],
    grasshopper: ['rgba(175, 245, 218, 1)', 'rgba(118, 223, 183, 1)', 'rgba(106, 192, 159, 1)', 'rgba(117, 124, 144, 1)', 'rgba(89, 134, 117, 1)', 'rgba(79, 105, 95, 1)'],
    grasshopper_opacity: ['rgba(175, 245, 218, 0.2)', 'rgba(118, 223, 183, 0.2)', 'rgba(106, 192, 159, 0.2)', 'rgba(117, 124, 144, 0.2)', 'rgba(89, 134, 117, 0.2)', 'rgba(79, 105, 95, 0.2)'],
    partytime: ['rgba(239, 127, 114, 1)', 'rgba(251, 174, 109, 1)', 'rgba(255, 203, 92, 1)', 'rgba(97, 197, 171, 1)', 'rgba(108, 163, 242, 1)', 'rgba(149, 134, 211, 1)'],
    partytime_opacity: ['rgba(239, 127, 114, 0.2)', 'rgba(251, 174, 109, 0.2)', 'rgba(255, 203, 92, 0.2)', 'rgba(97, 197, 171, 0.2)', 'rgba(108, 163, 242, 0.2)', 'rgba(149, 134, 211, 0.2)'],
    simbla: ['rgba(242, 179, 109, 1)', 'rgba(242, 133, 114, 1)', 'rgba(226, 109, 138, 1)', 'rgba(180, 108, 143, 1)', 'rgba(120, 105, 114, 1)', 'rgba(108, 119, 139, 1)'],
    simbla_opacity: ['rgba(242, 179, 109, 0.2)', 'rgba(242, 133, 114, 0.2)', 'rgba(226, 109, 138, 0.2)', 'rgba(180, 108, 143, 0.2)', 'rgba(120, 105, 114, 0.2)', 'rgba(108, 119, 139, 0.2)'],
    romantic: ["rgba(133,120,140,1)", "rgba(172,120,116,1)", "rgba(239,180,128,1)", "rgba(247,233,204,1)", "rgba(166,138,112,1)", "rgba(85,60,57,1)"],
    romantic_opacity: ["rgba(133,120,140,0.2)", "rgba(172,120,116,0.2)", "rgba(239,180,128,0.2)", "rgba(247,233,204,0.2)", "rgba(166,138,112,0.2)", "rgba(85,60,57,0.2)"],
    heatwave: ["rgba(255,206,111,1)", "rgba(246,99,28,1)", "rgba(189,88,55,1)", "rgba(139,66,25,1)", "rgba(164,30,26,1)", "rgba(76,27,27,1)"],
    heatwave_opacity: ["rgba(255,206,111,0.2)", "rgba(246,99,28,0.2)", "rgba(189,88,55,0.2)", "rgba(139,66,25,0.2)", "rgba(164,30,26,0.2)", "rgba(76,27,27,0.2)"],
    blooming: ["rgba(243,217,232,1)", "rgba(235,195,217,1)", "rgba(227,173,203,1)", "rgba(220,151,189,1)", "rgba(211,129,175,1)", "rgba(193,117,160,1)"],
    blooming_opacity: ["rgba(243,217,232,0.2)", "rgba(235,195,217,0.2)", "rgba(227,173,203,0.2)", "rgba(220,151,189,0.2)", "rgba(211,129,175,0.2)", "rgba(193,117,160,0.2)"],
    sunnysummer: ["rgba(255,243,200,1)", "rgba(249,235,123,1)", "rgba(254,205,88,1)", "rgba(250,157,95,1)", "rgba(202,234,244,1)", "rgba(140,210,230,1)"],
    sunnysummer_opacity: ["rgba(255,243,200,0.2)", "rgba(249,235,123,0.2)", "rgba(254,205,88,0.2)", "rgba(250,157,95,0.2)", "rgba(202,234,244,0.2)", "rgba(140,210,230,0.2)"],
    underthesea: ["rgba(176,232,231,1)", "rgba(103,195,171,1)", "rgba(57,158,171,1)", "rgba(68,93,133,1)", "rgba(66,70,106,1)", "rgba(34,38,62,1)"],
    underthesea_opacity: ["rgba(176,232,231,0.2)", "rgba(103,195,171,0.2)", "rgba(57,158,171,0.2)", "rgba(68,93,133,0.2)", "rgba(66,70,106,0.2)", "rgba(34,38,62,0.2)"],
    coldmountain: ["rgba(210,212,225,1)", "rgba(125,126,151,1)", "rgba(78,76,98,1)", "rgba(85,75,85,1)", "rgba(149,141,158,1)", "rgba(222,215,222,1)"],
    coldmountain_opacity: ["rgba(210,212,225,0.2)", "rgba(125,126,151,0.2)", "rgba(78,76,98,0.2)", "rgba(85,75,85,0.2)", "rgba(149,141,158,0.2)", "rgba(222,215,222,0.2)"],
    oldtown: ["rgba(246,227,188,1)", "rgba(233,152,51,1)", "rgba(175,78,73,1)", "rgba(235,195,70,1)", "rgba(82,158,186,1)", "rgba(47,58,96,1)"],
    oldtown_opacity: ["rgba(246,227,188,0.2)", "rgba(233,152,51,0.2)", "rgba(175,78,73,0.2)", "rgba(235,195,70,0.2)", "rgba(82,158,186,0.2)", "rgba(47,58,96,0.2)"],
    dayddream: ["rgba(231,235,238,1)", "rgba(206,215,226,1)", "rgba(168,182,203,1)", "rgba(134,147,170,1)", "rgba(245,214,213,1)", "rgba(245,235,230,1)"],
    dayddream_opacity: ["rgba(231,235,238,0.2)", "rgba(206,215,226,0.2)", "rgba(168,182,203,0.2)", "rgba(134,147,170,0.2)", "rgba(245,214,213,0.2)", "rgba(245,235,230,0.2)"]
}

function simblaChart() {
    var c = $(this);
    var cls = c.data('simbla-class');
    if (!cls) return;

    function run() {
        var query = new Simbla.Query(cls);

        var chartType = c.data('chart-type').toLowerCase()
        var groupby;
        if (c.data('chart-label-format')) {
            groupby = { label: {} };
            groupby.label[c.data('chart-label-format')] = c.data('chart-label');
        }
        if (chartType != "pie" && c.data('chart-category')) {
            if (!groupby)
                groupby = { label: c.data('chart-label') }
            if (c.data('chart-category-format')) {
                groupby["category"] = {};
                groupby["category"][c.data('chart-category-format')] = c.data('chart-category')
            } else
                groupby["category"] = c.data('chart-category');

        }
        if (!groupby)
            groupby = c.data('chart-label');


        var group = {};
        var func = c.data('chart-func');
        if (func == "sum-count")
            group["sum"] = 1;
        else
            group[func] = c.data('chart-value');
        addCriteriaToQuery(query, cls, c).aggregate(groupby, group).then(function(results) {
            function getLabel(id) {
                if (typeof id != "object" || id == null)
                    return decodeEntities(id || "Unknown");

                if (typeof id.label != "object")
                    return decodeEntities(id.label);
                var spliter = c.data('chart-label-format').split('/')
                return spliter.map(function(s) {
                    return id.label[s]
                }).join('/');


            }

            function getCategory(cat) {
                if (typeof cat != "object")
                    return decodeEntities(cat || "Unknown");


                var spliter = c.data('chart-category-format').split('/')
                return spliter.map(function(s) {
                    return cat[s]
                }).join('/');
            }

            function getColor(opacity, n) {
                while (n >= 6)
                    n -= 6;
                if (!ChartThemes[(c.data('chart-theme') || "simbla")])
                    c.data('chart-theme', 'simbla');
                return ChartThemes[(c.data('chart-theme') || "simbla") + (opacity ? "_opacity" : "")][n];
            }
            var labels = [],
                data;
            if (!groupby["category"] || chartType == "pie") {
                data = [];
                results.results.forEach(function(r) {
                    labels.push(getLabel(r._id));
                    data.push(r.value);
                })
            } else {
                data = {};

                results.results.forEach(function(r) {
                    var lbl = getLabel(r._id);
                    if (labels.indexOf(lbl) == -1)
                        labels.push(lbl);
                    var category = getCategory(r._id.category);
                    if (!data[category]) data[category] = [];
                    data[category][labels.indexOf(lbl)] = r.value;
                })

            }
            var options, customChartData = {};
            if (c.data('chart-options')) {
                if (typeof c.data('chart-options') == "object")
                    options = c.data('chart-options');
                else {
                    try {
                        options = JSON.parse(c.data('chart-options'))
                    } catch (e) {
                        console.error("chart options are not volid json. " + e.message);

                    }
                }
            }

            var chartData = {
                labels: labels,
                datasets: []
            };

            function getColorArr(opacity) {
                var arr = new Array();
                for (var i = 0; i < data.length; i++) {
                    arr.push(getColor(opacity, i))
                }
                return arr;
            }

            var baseData = {
                backgroundColor: chartType == "line" ? getColor(true, 0) : getColorArr(false),
                borderColor: chartType == "line" ? getColor(false, 0) : getColorArr(false),
                hoverBackgroundColor: getColorArr(false)

            }

            if (Array.isArray(data) || chartType == "pie") {
                baseData.data = data;
                baseData.label = c.data('simbla-class')
                chartData.datasets.push(baseData);
                if (chartType !== "pie" && (!options || !options.legend)) {
                    options = $.extend({}, options, { legend: { display: false } });
                }
            } else {


                var j = 0,
                    k = 0;
                for (var i in data) {
                    var dataset = {};
                    baseData.data = data[i];
                    baseData.label = i;
                    baseData.backgroundColor = getColor(chartType == "line", j++);
                    baseData.borderColor = getColor(false, k++);
                    $.extend(dataset, baseData);
                    chartData.datasets.push(dataset);
                }


            }
            if (c.data('chart-data')) {
                try {
                    customChartData = JSON.parse(c.data('chart-data'));
                    $.extend(chartData, customChartData);
                } catch (e) {
                    console.error("chart data are not volid json. " + e.message);

                }
            }
            c.find('.text-danger').remove();
            var canvas = c.find('canvas');
            if (canvas.data('chart-view')) canvas.data('chart-view').destroy();
            //canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
            if (chartType != "pie")
                options = $.extend(true, {}, options, {
                    scales: {
                        yAxes: [{
                            ticks: {
                                userCallback: function(label, index, labels) {
                                    if (typeof label !== "number") return label;
                                    return Math.round(label * 100) / 100;
                                },
                            }
                        }],
                    }
                });
            canvas.data('chart-view', new Chart(canvas, {
                type: chartType,
                data: chartData,
                options: options
            }));

            c.trigger('data-loaded', { results: results });
            setSimblaLinkTop();


        }, function(err) {

            c.find('.text-danger').remove();
            c.append('<div class="text-danger simbla-form"><label>' + err.message || "" + '</label></div>')

        })
    }
    if (c.data('query') == "form" && c.data('query-form')) {
        var form = $('.dbFormQuery[name="' + c.data('query-form') + '"]');
        if (form.length == 1) {
            form.removeAttr('onsubmit');
            form.on('submit', function() {
                run();
                return false;
            })
        }

    }
    c.on('refresh', run);
    run();

}


function simblaDynamicList() {
    var c = $(this);
    var cls = c.data('simbla-class');
    if (!cls) return;
    c.find('.dynamicListParent,.page-selection').hide();
    var maxVisible = c.find('.dynamicListItem').length + 1;
    var maxLimit = c.data('sort-limit');
    if (maxLimit && maxLimit < maxVisible)
        maxVisible = maxLimit;
    var page = 1;

    function getSort() {
        var sort = c.data('sort-by');
        if (!sort)
            return null;
        else return {
            sortOrder: c.data('sort-order'),
            sortBy: c.data('sort-by')
        }
    }

    function run() {
        var query = new Simbla.Query(cls);

        query.limit(maxVisible);
        if (page > 1) {
            var skip = (maxVisible * page) - maxVisible;
            query.skip(skip);

            if (maxLimit && skip + maxVisible > maxLimit)
                query.limit(maxLimit - skip)
        }
        var sort = getSort();

        if (sort) {
            query[sort.sortOrder](sort.sortBy);
        }
        var q = addCriteriaToQuery(query, cls, c);
        try {
            var firstElem = c.find('.dynamicListParent').fadeIn().eq(0);
            var html = firstElem.data('html') || firstElem.html();
            var searchInc = new RegExp("{{([A-Za-z0-9_]+)\.[A-Za-z0-9_.]+}}", "g");
            var arr = [];
            while (match = searchInc.exec(html)) {
                if (match[0].includes('.'))
                    arr.push(match[1]);
            }
            arr.forEach(function(i) {
                q.include(i);
            })
        } catch (e) {
            console.error(e);
        }
        /*
        // this code reduce the network use. but the data is case sensitive.
        var firstElem = c.find('.dynamicListParent').fadeIn().eq(0);
        var html = firstElem.data('html') || firstElem.html();
        if (!html) return;
        var fields = html.match(/{{[a-zA-Z0-9._-]+}}/g).map(function (s){return s.replace('{{', '').replace('}}','')})
         q.select.apply(q, fields);
         */

        q.find().then(function(e) {
            function replaceHtmlContnet(html, obj, pre) {
                pre = pre || "";
                if (obj)
                    for (var i in obj) {
                        if (typeof obj[i] == "object") {
                            if (obj[i] instanceof Date)
                                html = html.replace(new RegExp("{{" + pre + i + "}}", "gi"), obj[i].toLocaleString());
                            else
                                html = replaceHtmlContnet(html, obj[i], i + '.')
                        } else
                            html = html.replace(new RegExp("{{" + pre + i + "}}", "gi"), obj[i])
                    }
                if (!pre)
                    html = html.replace(/{{[A-Za-z0-9_.]*}}/g, '');

                return html;
            }
            var firstElem = c.find('.dynamicListParent').fadeIn().eq(0);
            var html = firstElem.data('html') || firstElem.html();
            if (!html) return;
            if (!firstElem.data('html'))
                firstElem.data('html', html);
            e.forEach(function(d, i) {
                d.attributes.id = d.attributes.objectId = d.id;
                var htmlCopy = replaceHtmlContnet(html, $.extend({}, d.attributes, { objectId: d.id, id: d.id }));
                c.find('.dynamicListParent').eq(i).html(htmlCopy);
            });
            var dynamicListItemCount = c.find('.dynamicListParent').length;

            if (dynamicListItemCount > e.length) {
                c.find('.dynamicListParent:gt(' + (e.length - 1) + ')').empty();
            }
            c.trigger('data-loaded', { results: e });
            loadRefresh();
        });

    }

    function count() {
        page = 1;
        var pagingElem = c.find('.page-selection');

        if (maxLimit && maxLimit <= maxVisible) {
            pagingElem.hide();
            return run();
        }
        addCriteriaToQuery((new Simbla.Query(cls)), cls, c).count({
            success: function(num) {
                if (maxLimit && num > maxLimit)
                    num = maxLimit;

                if (num > 0)
                    run();
                else {
                    c.trigger('data-loaded', { results: [] });
                    c.find('.dynamicListParent').empty();
                }

                if (num > maxVisible) {
                    var maxVisibleNum = Math.min(Math.floor((pagingElem.parent().width() - 66) / 33), 6);
                    pagingElem.show().empty().bootpag({
                        total: Math.ceil(num / maxVisible),
                        maxVisible: maxVisibleNum,
                        leaps: true,
                        page: page
                    }).on("page", function(event, /* page number here */ num) {
                        page = num;
                        run();
                    });
                } else {
                    pagingElem.hide();
                }


            },
            error: function(err) {
                if (err.code == 209) {
                    return Simbla.User.logOut().then(count, count);
                }

                showAlert(err.message);
            }
        });

    }
    if (c.data('query') == "form" && c.data('query-form')) {
        var form = $('.dbFormQuery[name="' + c.data('query-form') + '"]');
        if (form.length == 1) {
            form.removeAttr('onsubmit');
            form.on('submit', function() {
                count();
                return false;
            })
        }

    }
    c.on('refresh', count);
    count();
}

function simblaCounter() {

    var c = $(this);
    var cls = c.data('simbla-class');
    if (!cls) return;

    function setResults(n) {

        var $el = c.find('h1');
        var isInt = n % 1 == 0;
        var number = numeral();
        $({ percentage: 0 }).animate({ percentage: n }, {
            duration: 1000,
            step: function() {
                var percentageVal = !isInt ? Math.round(this.percentage * 10) / 10 : Math.round(this.percentage);
                $el.text(number.set(percentageVal).format(c.attr('data-format') || '0,0'));
            },
            complete: function() {
                $el.text(number.set(n).format(c.attr('data-format') || '0,0'));
            }
        });


    }

    function run() {
        var query = new Simbla.Query(cls);

        var q = addCriteriaToQuery(query, cls, c);
        var func = c.data('counter-function');
        if (func == "sum-count")
            q.count(setResults)
        else {
            if (!c.data('counter-field'))
                return console.warn("no field selected for " + func);
            var groupby = null;
            var group = {};
            group[func] = c.data('counter-field');

            q.aggregate(groupby, group).then(function(e) {
                var res = e.results;
                var num = res && res.length > 0 ? res[0].value : 0;
                //if (c.data('counter-function') == "avg" && num % 1 > 0) num = Number(num.toFixed(1));
                setResults(num);
            });
        }
    }

    if (c.data('query') == "form" && c.data('query-form')) {
        var form = $('.dbFormQuery[name="' + c.data('query-form') + '"]');
        if (form.length == 1) {
            form.removeAttr('onsubmit');
            form.on('submit', function() {
                run();
                return false;
            })
        }

    }
    c.on('refresh', run);
    run();
}


function simblaTable() {
    var m = $(this);
    var cls = m.data('simbla-class');
    if (!cls) return;

    var obj = Simbla.Object.extend(cls);
    var columns = m.find('thead th');
    var tbl = m.find('table');
    var tbody = m.find('tbody');
    var allowEdit = m.data('allow-edit') === true;
    var allowDelete = m.data('allow-delete') === true;

    var tdBorderColor = "";
    if (tbl.hasClass('table-bordered') && tbody.attr('style') && tbody.attr('style').indexOf('border-color') > -1)
        tdBorderColor = tbody.css('border-color');
    var strippedBgColor = "";
    if (tbl.hasClass('table-striped') && tbl.data('striped-color'))
        strippedBgColor = tbl.data('striped-color');
    var page = 1;
    var pages;
    var num;

    function setTdHtml(value, type, o) {
        switch (type) {
            case 'Date':
                return value && o.text(value.toLocaleString());

                break;
            case 'File':
                if (value) {
                    var url = value.url();
                    var a = $('<a>').attr('href', url).attr('target', '_blank');

                    if (url.lastIndexOf('png') == url.length - 3 || url.lastIndexOf('pg') == url.length - 2)
                        a.html('<img src="' + value.url() + '" />');
                    else
                        a.text(value.name().split('_')[1]);
                    o.append(a);

                }
                break;

            case 'Boolean':
                value != undefined && o.text(value.toString());
                break;
            case 'Number':
                if (value && value % 1 != 0)
                    return o.text(value.toFixed(2));
                o.text(value);
                break;
            case 'String':
                if (value && value.length > 53)
                    return o.html(value.substr(0, 50) + '...');
                o.html(value);
                break;
            default:
                o.text(value);
        }


    }

    function getLimit() {
        return Number(m.find('.rows-selection li.active a').text());
    }


    function getSort() {
        var sort = m.find('th.sort');
        if (sort.length == 0)
            return null;
        else return {
            sortOrder: sort.find('i').hasClass('fa-sort-asc'),
            sortBy: sort.data('field')
        }
    }


    function buildRow(d, i) {
        var tr = $('<tr>').data('val', d).data('num', i);

        columns.each(function() {
            var td = $('<td>').css('border-color', tdBorderColor);
            if (strippedBgColor && i % 2 == 0)
                td.css('background-color', strippedBgColor);

            var dataName = $(this).data('field'),
                val;
            if (dataName == "action") {
                td.addClass('action');
                if (allowEdit)
                    td.append($("<span>").addClass('fa fa-pencil'))
                if (allowDelete)
                    td.append($("<span>").addClass('fa fa-trash'))
                return tr.append(td);
            } else if (dataName == "objectId") {
                val = d.id;
            } else
                val = d.get(dataName);
            if (!val && dataName.indexOf('.') > 0) {
                var splited = dataName.split('.');
                var o = d.get(splited[0]);
                if (o)
                    val = o.get(splited[1])
            }
            setTdHtml(val, $(this).data('type'), td);
            if (typeof val != 'object')
                td.attr('title', decodeEntities(val));

            tr.append(td);
        });
        return tr;
    }


    function query() {

        var query = new Simbla.Query(obj);
        var limit = getLimit();

        query.limit(limit);
        if (page > 1)
            query.skip((limit * page) - limit);

        var sort = getSort();

        if (sort)
            if (sort.sortOrder)
                query.ascending(sort.sortBy);
            else
                query.descending(sort.sortBy);
        var fields = [];
        columns.each(function() {
            fields.push($(this).data('field'));
        });

        query.select.apply(query, fields);

        return addCriteriaToQuery(query, cls, m).find(function(results, err) {

            if (err) {
                return showAlert(err.message);
            }
            tbody.empty();
            if (!results || !results.length) {
                //if(page>1) page--;
                return;
            }


            results.forEach(function(d, i) {
                tbody.append(buildRow(d, i));
            });
            if ((pages && page === pages) || num <= getLimit())
                summaryLine();
            m.trigger('data-loaded', { results: results });
            setSimblaLinkTop();

        });
    }

    function summaryLine() {
        if (!m.data('show-sum')) return;
        var group = {}
        var results = {};
        new Simbla.Promise(function(resolve, reject) {

            m.find('th').each(function() {
                var summary = $(this).data('summary');
                if (summary) {

                    var field = $(this).data('aggr-field');
                    var key = field.replace(/\./g, '_');
                    if (summary == "count")
                        results[key] = num;
                    else {
                        group[key] = {}
                        group[key][summary] = field
                    }
                }
            });
            if (Object.keys(group).length > 0) {
                addCriteriaToQuery(new Simbla.Query(cls), cls, m).aggregate(null, group, true).then(function(e) {
                    if (e.results && e.results.length > 0) {
                        var data = e.results[0];
                        for (var i in data) {
                            results[i] = data[i]
                        }
                    }
                    resolve(results);

                });
            } else {
                resolve(results);
            }
        }).then(function(data) {
            if (data && Object.keys(data).length > 0) {
                var tr = $('<tr>');

                m.find('th').each(function(i) {
                    var td = $('<td>')
                    if (i == 0)
                        td.text(m.data('sum-text'));
                    var field = $(this).data('aggr-field');
                    if (field) {
                        var key = field.replace(/\./g, '_');

                        if (data[key] != undefined && data[key].toString()) {
                            var n = data[key];
                            td.text(td.text() + (Number(n) === n && n % 1 !== 0 ? n.toFixed(2) : n));
                        }
                    }
                    if (tbl.data('footer-css'))
                        td.css(tbl.data('footer-css'));
                    tr.append(td);
                })
                m.find('tbody').append(tr);
                setSimblaLinkTop();
            }
        });
    }

    function count() {
        addCriteriaToQuery((new Simbla.Query(obj)), cls, m).count({
            success: function(c) {
                num = c;
                var pagingElem = m.find('.page-selection');
                if (c > getLimit()) {
                    var maxVisible = Math.min(Math.floor((pagingElem.parent().width() - 66) / 33), 6);
                    pages = Math.ceil(num / getLimit());
                    pagingElem.show().empty().bootpag({
                        total: pages,
                        maxVisible: maxVisible,
                        leaps: true,
                        page: 1
                    }).off('page').on("page", function(event, /* page number here */ num) {
                        page = num;
                        query();
                    });
                } else {
                    pagingElem.hide();
                }
                if (c < 11) {
                    m.find('.rows-selection').hide()
                }
                if (c > 0)
                    query();
                else {
                    tbody.empty();
                    m.trigger('data-loaded', { results: [] });
                }
            },
            error: function(err) {
                if (err.code == 209) {
                    return Simbla.User.logOut().then(count, count);
                }

                showAlert(err.message);
            }
        });

    }

    if (m.data('query') == "form" && m.data('query-form')) {
        var form = $('.dbFormQuery[name="' + m.data('query-form') + '"]');
        if (form.length == 1) {
            form.removeAttr('onsubmit');
            form.on('submit', function() {
                page = 1;
                count();
                return false;
            })
        }

    }


    m.on('refresh', count);
    m.on('click', 'th', function() {
        var th = $(this);
        var i = th.find('i');
        if (i.length == 0) return;
        if (!th.hasClass('sort')) {
            m.find('th.sort').removeClass('sort')
                .find('i')
                .removeClass('fa-sort-asc')
                .removeClass('fa-sort-desc')
                .addClass('fa-sort');

            th.addClass('sort');
            i.removeClass('fa-sort').addClass('fa-sort-asc');

        } else {
            if (th.find('i').hasClass('fa-sort-asc'))
                i.removeClass('fa-sort-asc').addClass('fa-sort-desc');
            else {
                i.removeClass('fa-sort-desc').addClass('fa-sort');
                th.removeClass('sort')
            }
        }
        m.find('.page-selection').empty().bootpag({
            total: Math.ceil(num / getLimit()),
            maxVisible: 6,
            leaps: true
        });
        page = 1;
        query();
    });
    m.find('.rows-selection li a').on('click', function() {

        m.find('.rows-selection li').not($(this).parent()).removeClass('active');
        $(this).parent().addClass('active');
        // hide or show and init the paging.
        m.find('.page-selection')[num > getLimit() ? "show" : "hide"]().empty().bootpag({
            total: Math.ceil(num / getLimit()),
            maxVisible: 6,
            leaps: true
        });
        page = 1;
        query();
    });

    /*if (!checkFormInitialVal(m)) {
      m.find('.page-selection').hide()
      return;
    }*/
    count();

}

function loadGalleryData() {
    var g = $(this);
    var rows = g.data('rows') ? Number(g.data('rows')) : 3;
    var columns = g.data('columns') ? Number(g.data('columns')) : 3;
    var limit = rows * columns;
    var maxLimit = g.data('sort-limit');
    if (maxLimit && maxLimit < limit)
        limit = maxLimit;
    var colWidth = 12 / columns;
    var cls = g.data('simbla-class');
    if (!cls) return;
    var obj = Simbla.Object.extend(cls);
    var image = g.data('image-field'),
        url = g.data('url-field'),
        title = g.data('title-field');
    var page = 1;

    function getSort() {
        var sort = g.data('sort-by');
        if (!sort)
            return null;
        else return {
            sortOrder: g.data('sort-order'),
            sortBy: g.data('sort-by')
        }
    }



    function query() {
        var query = new Simbla.Query(obj);
        query.limit(limit);
        if (page > 1) {
            var skip = (limit * page) - limit;
            query.skip(skip);

            if (maxLimit && skip + limit > maxLimit)
                query.limit(maxLimit - skip)
        }

        query.select.apply(query, [image, url, title]);

        var sort = getSort();
        if (sort) {
            query[sort.sortOrder](sort.sortBy);
        }
        addCriteriaToQuery(query, cls, g).find(function(results, err) {
            if (err) {

                return showAlert(err.message);
            }

            g.find('>*:not(.page-selection)').remove();
            if (!results || !results.length) {
                //if(page>1) page--;
                return;
            }
            var figure = $("<figure class='simblaEL simblaImg'><img class='newImage' /><figcaption></figcaption></figure>");
            figure.css('border-redius', g.data('border-radius'));

            var rowsData = [];
            for (var i = 0; i < rows && columns * i < results.length; i++) {
                var row = $('<div>').addClass('row rDivider');

                for (var j = 0; j < columns && j + columns * i < results.length; j++) {
                    var data = results[j + columns * i];
                    var img = data.get(image) && data.get(image).url && data.get(image).url() || "";
                    var fig = figure.clone().attr('id', data.id);
                    fig.find('img').attr('src', img).attr('alt', data.get(title));
                    var col = $('<div>').addClass('sDivider col-md-' + colWidth + ' col-sm-' + colWidth);
                    var link = url && data.get(url);
                    if (link) {
                        if (link.url) link = link.url();
                        fig.append($('<a>').attr('href', link).append(fig.find('img, figcaption')))
                    }

                    col.append(fig);
                    row.append(col);

                }
                rowsData.push(row);
            }
            rowsData.push(g.find('.page-selection'))
            g.append.apply(g, rowsData);
            g.trigger('data-loaded', { results: results });
            loadGalleryEffects();
            setSimblaLinkTop();


        });
    }

    function count() {
        addCriteriaToQuery((new Simbla.Query(obj)), cls, g).count({
            success: function(c) {
                if (maxLimit && c > maxLimit)
                    c = maxLimit;
                if (c > limit) {

                    g.find('.page-selection').show().empty().bootpag({
                        total: Math.ceil(c / limit),
                        maxVisible: 6,
                        leaps: true
                    }).on("page", function(event, /* page number here */ num) {
                        page = num;
                        query();
                    });
                } else {
                    g.find('.page-selection').hide()
                }
                if (c > 0)
                    query();
                else {
                    g.find('>*:not(.page-selection)').remove();
                    g.trigger('data-loaded', { results: [] })
                }

            },
            error: function(err) {
                if (err.code == 209) {
                    return Simbla.User.logOut().then(count, count);
                }

                showAlert(err.message);
            }
        });
    }

    g.on('refresh', count);

    if (g.data('query') == "form" && g.data('query-form')) {
        var form = $('.dbFormQuery[name="' + g.data('query-form') + '"]');
        if (form.length == 1) {
            form.removeAttr('onsubmit');
            form.on('submit', function() {
                count();
                return false;
            })
        }

    }
    /*if (!checkFormInitialVal(g)) {
      g.find('.page-selection').hide()
      return;
    }*/
    count();


}

function setDataToForm(o, f) {
    f = f || form;
    o = o || obj;
    for (var i in o.attributes) {
        var input = f.find('[name="' + i + '"]');
        var val = o.attributes[i];
        if (val instanceof Simbla.File) {
            var img = input.parent().find('img');
            if (img.length == 0) img = input.parent().parent().find('img');
            if (img.length > 0)
                img.attr('src', val.url());
            continue;
        }
        if (input.is('[type="date"]'))
            input[0].valueAsDate = val;
        else if (input.is(':checkbox'))
            input.prop('checked', val);
        else if (input.is('.select-pointer'))
            input.val(val.id).data('val', val.id);
        else if (input.attr('type') == 'file') {
            continue;
        } else
            input.val(decodeEntities(val));

        if (input.is('.wysiwyg-editor'))
            input.sceditor('instance').val(input.val())

    }
    $(document).trigger('simblaobjectsettoform', {
        obj: o,
        form: f
    })

};


var winDiv, simblaLink;

function simblaFormSubmit(form) {
    var T = $(form);

    function error(err) {
        spin.remove();
        if (T.data('failure-type') == 'text')
            T.append('<div class="text-danger simbla-form"><label>' + (typeof err == "object" ? (err.err ? (typeof err.err == "string" ? err.err : err.err.response) : err.responseText) : "") + " " + T.data('failure') + '</label></div>');
        else if (T.data('failure-type') == 'link') {
            window.location = T.data('failure')
        }

        if (err.responseText && err.responseText.toUpperCase().indexOf('CAPTCHA'))
            grecaptcha.reset(T.data('captcha'));
    }

    T.find('.simbla-form').remove();
    if (T.attr('action') == undefined) {


        var serialize = T.serializeArray();
        var data = {};
        serialize.forEach(function(e) {
            var name = e.name;
            if (!data[name])
                data[name] = e.value;
            else {
                if (!$.isArray(data[name]))
                    data[name] = [data[name]];
                data[name].push(e.value)
            }
        });
        T.find('select[disabled]').each(function() {
            if ($(this).val())
                data[$(this).attr('name')] = $(this).val();
        });
        data.formName = T.attr('name');
        var spin = $('<div class="simbla-form"><i class="simbla-loader-min"></i></i></div>');
        T.append(spin);
        T.find('.text-success.simbla-form,.text-danger.simbla-form').remove();
        $.post('/', data, function(e) {

            if (e && e.err != null)
                error(e);
            else {
                spin.remove();
                if (T.data('success-type') == 'text')
                    T.append('<div class="text-success simbla-form"><label>' + T.data('success') + '</label></div>')
                else if (T.data('success-type') == 'link') {
                    window.location = T.data('success')
                }
            }
            grecaptcha.reset(T.data('captcha'));


        }).fail(error);

        return false;

    }
}

function showAlert(msg, confirm, cb) {
    msg = typeof msg == "object" ? msg.message : msg;
    $('.show-alert-modal').modal('hide')
    var modal = $('<div>').addClass('modal fade show-alert-modal').attr('role', 'dialog').css('overflow', 'hidden');
    var content = $('<div>').addClass('modal-content');

    var message = $('<p>').text(msg);
    content.append($('<div>').addClass('modal-body').append(message));
    var close = $('<button>').attr('type', 'button')
        .addClass('btn btn-default')
        .attr('data-dismiss', 'modal').text("Close");
    if (confirm) {
        close.attr('bs-btn', '');
        var confBtn = close.clone().addClass('btn-success').text(confirm);
        confBtn.on('click', cb)
        close = close.add(confBtn);

    }
    content.append($('<div>').addClass('modal-footer').append($('<div>').addClass(!confirm ? 'text-center' : '').append(close)));

    modal.append($('<div>').addClass('modal-dialog').append(content));

    modal.on('hidden.bs.modal', function(e) {
        modal.remove();
    });
    $('body').append(modal);
    modal.modal('show');
}

function onloadRecaptcha() {
    $('.simblaRecaptcha>.captcha').each(function(i) {
        var id = 'simblaRecptcha' + i;
        $(this).attr('id', id);

        var captId = grecaptcha.render(id, {
            'sitekey': reCaptchaKey
        });
        $(this).closest('form').data('captcha', captId);

    })

}

function addOpacityToColor(color, opacity) {
    if (color == "")
        return color;
    if (opacity > 1)
        opacity /= 100;
    if (color.indexOf('rgb(') > -1) {
        return color.substring(0, color.length - 1).replace('rgb(', 'rgba(') + ',' + opacity + ')';
    } else if (color.indexOf('rgba(') > -1) {
        var color = color.split(',')
        color.pop()
        return color.join(',') + ',' + opacity + ')';
    } else {
        var h = hexToRgb(color);
        return 'rgba(' + h.r + ',' + h.g + ',' + h.b + ',' + opacity + ')'
    }


}

function getColor(el, type) {
    var bgColor = "#fff";
    switch (type) {
        case "solid":
        case "rounded":
            bgColor = $(el).css('backgroundColor');
            break;
        case "underline":
            bgColor = $(el).css('borderBottomColor');
            break;
        case "border":
            bgColor = $(el).css('borderColor');
            break;
        case "divider":
            var borderR = $(el).parents('.rtl').length == 0 ? "borderRightColor" : "borderLeftColor";
            bgColor = $(el).css(borderR);
            break;
    }
    return bgColor;
}

function setBackgroundType(elem, color, type, hover) {

    type = type.toLowerCase();
    var cssObj = {}
    if (!hover)
        cssObj = {
            "border": "none",
            "borderBottom": "none",
            "borderRight": "none",
            "borderLeft": "none",
            "backgroundColor": "transparent",
            "borderRadius": 0,
            "marginRight": 0,
            "marginLeft": 0
        }

    if (type != "none")
        switch (type) {
            case "solid":
                cssObj["backgroundColor"] = color;
                break;
            case "underline":
                cssObj["borderBottom"] = "5px solid " + color;
                break;
            case "border":
                cssObj["border"] = "2px solid " + color;
                cssObj["borderRight"] = "2px solid " + color;
                cssObj["borderLeft"] = "2px solid " + color;
                cssObj["borderBottom"] = "2px solid " + color;
                break;
            case "rounded":
                cssObj["backgroundColor"] = color;
                cssObj["borderRadius"] = "4px";
                cssObj["marginRight"] = "3px";
                if (hover && $(elem).css("marginLeft") == "0px")
                    cssObj["marginLeft"] = "3px";
                break;
            case "divider":
                cssObj["borderLeft"] = "1px solid " + color;
                cssObj["borderRight"] = "1px solid " + color;
                break;
        }

    $(elem).css(cssObj);
}

function getOpacity(el, type) {

    var opacity = 1;

    switch (type) {
        case "solid":
        case "rounded":
            opacity = $(el).css('backgroundColor');
            break;
        case "underline":
            opacity = $(el).css('borderBottomColor');
            break;
        case "border":
            opacity = $(el).css('borderColor');
            break;
        case "divider":
            var borderR = $(el).parents('.rtl').length == 0 ? "borderRightColor" : "borderLeftColor";
            opacity = $(el).css(borderR);
            break;
    }
    if (!opacity || opacity >= 1 || typeof opacity != "string")
        return 1;
    return opacity.split(',').pop().replace(')', '');
}

function hexToRgb(hex) {
    var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, function(m, r, g, b) {
        return r + r + g + g + b + b;
    });

    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function setMenuStyle(m) {

    var menu = m;
    var links = menu.find('li a');
    var font = menu.attr('data-font');
    links.css('font-family', font);


    var fontSize = menu.attr('data-font-size');
    if (fontSize) {
        links.css('font-size', fontSize + 'px');
        links.css('line-height', fontSize + 'px');
    } else {
        links.css('font-size', '');
        links.css('line-height', '');
    }
    var fontWeight = menu.attr('data-font-weight');
    links.css('font-weight', fontWeight);


    var fontColor = menu.attr('data-font-color');
    links.css('color', fontColor);

    var iconColor = menu.attr('data-icon-color');
    if (iconColor)
        links.find('span.fa').css('color', iconColor);

    var indColor = menu.attr('data-ind-color');
    var indType = menu.attr('data-type');

    if (indType) {
        links.each(function() {
            setMenuBackgroundType($(this), indColor, indType);
        });

    }

    var current = menu.find('li.active a, li a.current'); //links.filter('.current');
    var cfontWeight = menu.attr('data-font-weight-current');
    current.css('font-weight', cfontWeight);

    var cfontColor = menu.attr('data-font-color-current');
    current.css('color', cfontColor);

    var cIconColor = menu.attr('data-icon-color-current');
    if (cIconColor)
        current.find('span.fa').css('color', cIconColor);

    var cindColor = menu.attr('data-ind-color-current');

    if (indType) {
        setMenuBackgroundType(current, cindColor, indType);
    }

    var hoverWeight = menu.attr('data-font-weight-hover');
    var hoverColor = menu.attr('data-font-color-hover');
    var hoverInd = menu.attr('data-ind-color-hover');
    var hoverIconColor = menu.attr('data-icon-color-hover');


    var hWeight, hColor, hIndColor, hIColor;
    menu.off('mouseenter mouseleave');

    if (hoverWeight && hoverWeight != fontWeight)
        hWeight = hoverWeight;
    if (hoverColor != fontColor)
        hColor = hoverColor;
    if (hoverIconColor != iconColor)
        hIColor = hoverIconColor;
    if (indType && hoverInd != indColor)
        hIndColor = hoverInd;

    if (hColor || hWeight || hIndColor) {
        menu.on({
            mouseenter: function() {
                $(this).css({
                    color: hColor,
                    fontWeight: hWeight
                });
                $(this).find('span.fa').css('color', hIColor || hColor);

                setMenuBackgroundType(this, hoverInd, indType, true)

            },
            mouseleave: function() {
                $(this).css({
                    color: fontColor,
                    fontWeight: fontWeight
                });
                $(this).find('span.fa').css('color', iconColor || fontColor);

                setMenuBackgroundType(this, indColor, indType, false)

            }
        }, 'li:not(.active) a:not(.current)');


    }

}


function setMenuBackgroundType(elem, color, type, hover) {

    if ($(elem).parent().parent().is('.dropdown-menu'))
        return;

    type = type && type.toLowerCase();

    if ($(window).width() < 768 || $(elem).closest('.menuHolder2').attr('data-group-type') == "collapse") {
        type = "solid";
    }
    var cssObj = {}
    if (!hover)
        cssObj = {
            "border": "none",
            "borderBottom": "none",
            "borderRight": "none",
            "borderLeft": "none",
            "backgroundColor": "transparent",
            "borderRadius": 0,
            "marginRight": 0,
            "marginLeft": 0
        }
    if (!color && (type == "underline" || type == "border" || type == "divider"))
        color = "transparent";
    if (type != "none")
        switch (type) {
            case "solid":
                cssObj["backgroundColor"] = color;
                break;
            case "underline":
                cssObj["borderBottom"] = "5px solid " + color;
                break;
            case "border":
                cssObj["border"] = "2px solid " + color;
                cssObj["borderRight"] = "2px solid " + color;
                cssObj["borderLeft"] = "2px solid " + color;
                cssObj["borderBottom"] = "2px solid " + color;
                break;
            case "rounded":
                cssObj["backgroundColor"] = color;
                cssObj["borderRadius"] = "4px";
                cssObj["marginRight"] = "3px";
                //if (hover && $(elem).css("marginLeft") == "0px")
                cssObj["marginLeft"] = "3px";
                break;
            case "divider":
                // if page is rtl divider should by on left.
                // var borderR = $(elem).parents('.rtl').length == 0 ? "borderRight" : "borderLeft";
                cssObj["borderLeft"] = "1px solid " + color;
                cssObj["borderRight"] = "1px solid " + color;

                break;
        }

    $(elem).css(cssObj);
}

function toHex(n) {
    n = parseInt(n, 10);
    if (isNaN(n)) return "00";
    n = Math.max(0, Math.min(n, 255));
    return "0123456789ABCDEF".charAt((n - n % 16) / 16) +
        "0123456789ABCDEF".charAt(n % 16);
}

function colorToHex(color) {
    if (!color)
        return "";
    if (color.substr(0, 1) === '#') {
        return color;
    }
    var digits = /(.*?)rgb\((\d+), (\d+), (\d+)\)/.exec(color);
    if (!digits)
        return "#fff";
    var red = parseInt(digits[2]);
    var green = parseInt(digits[3]);
    var blue = parseInt(digits[4]);

    return '#' + toHex(red) + toHex(green) + toHex(blue);

};

function LightenDarkenColor(col, amt) {

    var usePound = false;

    if (col[0] == "#") {
        col = col.slice(1);
        usePound = true;
        if (col.length == 3)
            col += col;
    }

    var num = parseInt(col, 16);

    var r = (num >> 16) + amt;
    var reverse = Math.abs(amt) * 2;
    if (r > 255) r -= reverse;
    else if (r < 0) r += reverse;

    var b = ((num >> 8) & 0x00FF) + amt;

    if (b > 255) b -= reverse;
    else if (b < 0) b += reverse;

    var g = (num & 0x0000FF) + amt;

    if (g > 255) g -= reverse;
    else if (g < 0) g += reverse;

    return (usePound ? "#" : "") + (g | (b << 8) | (r << 16)).toString(16);

}

function addCSSRule(sheet, selector, rules, index) {
    if ("insertRule" in sheet) {
        sheet.insertRule(selector + "{" + rules + "}", index || 0);
    } else if ("addRule" in sheet) {
        sheet.addRule(selector, rules, index);
    }
}

function createRole(selector) {
    //var selector = itemIdSelector + cls;
    return selector + ":active, " + selector + ":focus, .btn" + selector + ":hover, " + selector + ".hover"

}

function createHoverEffectsCssRols(item, color) {
    var style = $('#hoverEffects' + item.attr('id')),
        sheet;
    if (style.length == 0) {
        var style = document.createElement("style");

        style.setAttribute("id", "hoverEffects" + item.attr('id'));

        style.appendChild(document.createTextNode(""));

        document.head.appendChild(style);
        sheet = style.sheet;
    } else
        sheet = style[0].sheet;

    while (sheet.rules && sheet.rules.length > 0)
        sheet.deleteRule(0);

    var idSel = '#' + item.attr('id');


    if (item.hasClass('hvr-fade'))
        addCSSRule(sheet, createRole(idSel + '.hvr-fade'), "background-color: " + color);
    else if (item.hasClass('hvr-sweep-to-right'))
        addCSSRule(sheet, idSel + '.hvr-sweep-to-right:before', 'background: ' + color)
        //else if (item.hasClass('hvr-border-fade'))
        //    addCSSRule(sheet, createRole(idSel + '.hvr-border-fade'), "box-shadow: inset 0 0 0 4px " + color + ",0 0 1px rgba(0,0,0,0)");
        //else if (item.hasClass('hvr-reveal'))
        //    addCSSRule(sheet, idSel + '.hvr-reveal:before', 'border-color: ' + color);
        //else if (item.hasClass('hvr-trim'))
        //    addCSSRule(sheet, idSel + '.hvr-trim:before', 'border-color: ' + color);
        //else if (item.hasClass('hvr-ripple-out'))
        //    addCSSRule(sheet, idSel + '.hvr-ripple-out:before', 'border-color: ' + color);
        //else if (item.hasClass('hvr-outline-out'))
        //    addCSSRule(sheet, idSel + '.hvr-outline-out:before', 'border-color: ' + color);
    else if (item.hasClass('hvr-icon-fade'))
        addCSSRule(sheet, createRole(idSel + '.hvr-icon-fade'), 'color: ' + color);
    else if (item.hasClass('hvr-underline-from-center'))
        addCSSRule(sheet, idSel + '.hvr-underline-from-center:before', 'background: ' + color);
    else if (item.hasClass('hvr-bounce-to-top'))
        addCSSRule(sheet, idSel + '.hvr-bounce-to-top:before', 'background: ' + color);

}

function setMinHeight() {

    var screenHeight = window.innerHeight;
    $('.minHeight100').css('min-height', screenHeight + 'px');
    $('.minHeight100.simbla-wrapper').css('height', screenHeight + 'px')

    $('.minHeight80').css('min-height', screenHeight * 0.8 + 'px');
    $('.minHeight60').css('min-height', screenHeight * 0.6 + 'px');
    $('.minHeight40').css('min-height', screenHeight * 0.4 + 'px');
    $('.minHeight20').css('min-height', screenHeight * 0.2 + 'px');

}

function loadGalleryEffects() {
    $('.simblaGallery figure').off('mouseenter').off('mouseleave').on({
        mouseenter: function() {
            var text = $(this).find('img').attr('alt');
            var elem = $(this).closest('.simblaGallery');
            var textColor = elem.attr('data-g-text-color');
            var hoverColor = elem.attr('data-g-hover-color');
            $(this).data('origin-bg-color', $(this).data('origin-bg-color') || $(this).css('background-color'));

            $(this).css('background-color', hoverColor);
            if (text && text.length > 0) {
                $(this).find('figcaption h2').remove();
                $(this).find('figcaption').append($('<h2>').text(text).css('color', textColor));
            }
        },
        mouseleave: function() {
            var T = $(this);


            setTimeout(function() {
                if (!T.is(':hover'))
                    T.css({ backgroundColor: T.data('origin-bg-color') })
            }, 350);
            var H2 = T.find('h2');

            H2.animate({ opacity: 0 }, 350, function() {
                H2.remove();
            });

            //setTimeout(, 350)
        }
    }).each(function() {
        if ($(this).find('a').length == 1) {
            $(this).find('figcaption').appendTo($(this).find('a'))
        }
    });
}

function setGroupIdHeight() {
    if ($(window).width() > 768) {
        var dataGroups = {};
        $('[data-group-id]').each(function() {
            var groupId = $(this).attr('data-group-id');
            if (!groupId) return;
            var height = $(this).outerHeight();
            if (!dataGroups[groupId] || dataGroups[groupId] < height)
                dataGroups[groupId] = height;
        });
        for (var i in dataGroups)
            $('[data-group-id="' + i + '"]').css('min-height', dataGroups[i]);
    }
}
$(function() {
    winDiv = $('#windowDiv');
    simblaLink = $('a#linkToSimbla');
    $('.menuHolder2').each(function() {
        setMenuStyle($(this));
    });
    $('body').on('activate.bs.scrollspy', function() {
        $('.menuHolder2').each(function() {
            setMenuStyle($(this));
        });
    });
    var marginProp = 'margin-left';
    if (winDiv.is('.rtl')) {
        marginProp = 'margin-right';

    }
    $('[type="date"][value]').each(function() {
        if (this.defaultValue) {
            var date = dateManipulate(this.defaultValue);

            if (!isFinite(date)) return;

            var day = ("0" + date.getDate()).slice(-2);
            var month = ("0" + (date.getMonth() + 1)).slice(-2);

            date = date.getFullYear() + "-" + (month) + "-" + (day);
            $(this).val(date);
        }
    });

    $('.simbla-table').each(simblaTable);
    $('.simbla-chart').each(simblaChart);
    $('.simbla-counter').each(simblaCounter)
    $('.simblaDynamicList').each(simblaDynamicList);
    $(document).scroll(function() {
        var scrollVal = $(document).scrollTop();
        $('header.sticky').each(function() {
            var T = $(this);

            //if (scrollVal > 0 && !T.hasClass('on-scroll') && $(document).height() - T.height() <= $(window).height()){
            //    return;
            //}

            var slideType = T.data('slide-type');

            if (T.data('topoffset') < scrollVal) {

                if (T.hasClass('on-scroll'))
                    return;

                T.addClass('on-scroll');
                T[0].style.setProperty("position", "fixed", "important");
                T.next().not('nav').css('margin-top', '+=' + T.height()).data('scroll-next-margin', T.height());
                if (slideType != "slide")
                    T[0].style.setProperty("top", "0");
                else {
                    var height = T.outerHeight();
                    T.css({
                        top: -height + 'px',
                        'transform': 'translateY(' + height + 'px)'
                    });

                }

                var leftOffset = T.data('leftoffset');
                //if (marginProp.indexOf('right') > -1)
                //    leftOffset = -leftOffset;
                if (leftOffset && leftOffset > 0) {
                    T.css(marginProp, -leftOffset);
                    T.css(marginProp.replace('margin', 'padding'), leftOffset);

                    if (T.parent().is('.container') && T.find('>.container').length == 0) {
                        var div = $('<div class="container"></div>');
                        T.children().appendTo(div);
                        T.append(div);

                    }
                }
                //if (slideType == "none")
                //  return;
                if (T[0].style.backgroundColor)
                    T.data('origin-background', T.css('background-color'));
                //secondary
                var newClass = T.data('style-class');
                if (newClass && !T.hasClass(newClass)) {
                    var currentClass = true;
                    if (T.hasClass('main'))
                        currentClass = 'main';
                    else if (T.hasClass('secondary'))
                        currentClass = 'secondary';
                    else if (T.hasClass('negative'))
                        currentClass = 'negative';
                    T.removeClass(currentClass);
                    T.addClass(newClass);
                    T.data('classAdded', currentClass);
                }

                if (T.data('opacity') != 100) {

                    var tempDiv = $('<header>').attr('data-drag', T.attr('data-drag')).attr('id', T.attr('id')).attr('style', T.attr('style')).addClass(T.attr('class')).css('display', 'none').insertBefore(T);
                    var currentColor = tempDiv.css('background-color');
                    tempDiv.remove();

                    var bgColor = addOpacityToColor(currentColor, T.data('opacity'));

                    T.css('background-color', bgColor);
                }


            } else {
                if (T.hasClass('on-scroll')) {
                    T.removeClass('on-scroll');
                    T[0].style.setProperty("position", "relative", "important");
                    T[0].style.setProperty("top", "");
                    T.next().not('nav').css('margin-top', '-=' + T.height()).data('scroll-next-margin', '');


                    if (T.data('origin-background'))
                        T.css({ 'background-color': T.data('origin-background') });
                    else
                        T.css({ 'background-color': "" });

                    var originClass = T.data('classAdded');
                    if (originClass) {
                        T.removeClass(T.data('style-class'));
                        if (originClass != true)
                            T.addClass(originClass)
                    }

                    if (T.data('slide-type') == "slide") {
                        T.css({ 'position': '', 'transform': '' });
                    }

                    var leftOffset = T.data('leftoffset');
                    if (leftOffset) {
                        T.css(marginProp, '').css(marginProp.replace('margin', 'padding'), '');
                    }
                }


            }

        });
        setSimblaLinkTop();

    });
    //old menu
    $('.menuHolder').find("[data-hover-color], [data-hover-backgroundcolor]").each(function() {
        var elem = $(this);
        elem.off('mouseenter mouseleave');
        var color = elem.find('a:first').css('color'),
            hoverColor = elem.attr('data-hover-color'),
            hoverBG = elem.attr('data-hover-backgroundcolor'),
            hoverOpacity = elem.attr('data-hover-opacity') || 1,
            fontFamily = elem.find('a:first')[0] && elem.find('a:first')[0].style.fontFamily,
            hoverFontFamily = elem.attr('data-hover-fontfamily'),
            fontSize = elem.find('a:first').css('fontSize'),
            hoverFontSize = elem.attr('data-hover-fontsize'),
            fontWeight = elem.find('a:first').css('fontWeight'),
            hoverFontWeight = elem.attr('data-hover-fontweight'),
            bgType = elem.attr('data-bgtype') || "solid",
            hoverBgType = elem.attr('data-hover-bgtype') || "solid",
            bgColor = getColor(elem.find('a:first'), bgType),
            opacity = getOpacity(elem.find('a:first'), bgType)

        if (hoverBG) {
            var h = hexToRgb(hoverBG);
            hoverBG = 'rgba(' + h.r + ',' + h.g + ',' + h.b + ',' + hoverOpacity + ')'
        }
        if (elem.parents('.container-fluid').find('.navbar-toggle').is(':visible')) {
            elem.css("height", "")
        }
        /* if ( (!elem.attr('style') || elem.attr('style').indexOf('height') == -1) && elem.attr('data-bgtype') != "underline" && elem.attr('data-hover-bgtype') == "underline"
    && (elem.attr('data-current-bgtype') != "underline" || elem.find('.current').length == 0) ) {
    var x = 5;
    if (elem.attr('data-bgtype') == "border" || elem.attr('data-current-bgtype') == "border" || elem.find('.current').length > 0)
    x = 3
    elem.height(elem.height() + x)
  }
  */

        if (hoverBG || hoverColor)
            elem.on({
                mouseenter: function() {
                    if (!$(this).data('custom-style')) {
                        $(this).css({
                            color: hoverColor,
                            /*backgroundColor: hoverBG,opacity: hoverOpacity, */
                            fontFamily: hoverFontFamily,
                            fontSize: hoverFontSize,
                            fontWeight: hoverFontWeight
                        });
                        setBackgroundType(this, hoverBG, hoverBgType, true)
                    }
                },
                mouseleave: function() {
                    if (!$(this).data('custom-style')) {
                        $(this).css({
                            color: color,
                            /* backgroundColor: bgColor, opacity: opacity,*/
                            fontFamily: fontFamily,
                            fontSize: fontSize,
                            fontWeight: fontWeight
                        });
                        setBackgroundType(this, bgColor, bgType, false)
                    }
                }
            }, 'a');

    });

    /*var location = window.location.pathname;
    if (window.location.host == "sites.simbla.com") {
    location = location.split('/');
    location.splice(0, 2);
    location = location.join('/');
    } */
    $('.menuHolder').find("ul.nav li a.current").each(function() {
        var ul = $(this).parents('ul.nav'),
            bgColor = ul.data('current-backgroundcolor'),
            color = ul.data('current-color'),
            opacity = ul.data('current-opacity') || 1,
            fontFamily = ul.data('current-fontfamily'),
            fontSize = ul.data('current-fontsize') || "13px",
            fontWeight = ul.data('current-fontweight') || "normal",
            bgType = ul.data('current-bgtype') || "solid";


        if (bgColor) {
            var h = hexToRgb(bgColor);
            bgColor = 'rgba(' + h.r + ',' + h.g + ',' + h.b + ',' + opacity + ')';
            $(this).css({
                /*'background-color': bgColor,*/
                color: color,
                fontFamily: fontFamily,
                fontSize: fontSize,
                fontWeight: fontWeight
            }).data('custom-style', true);
            setBackgroundType(this, bgColor, bgType, true)
        }
    });


    //$(".right.carousel-control").click();

    $('a[href*="#"]').not('.carousel-control').on('click', function(e) {

        var target = this.hash;
        if (target.length > 0 && this.href.split("#")[0] == window.location.href.split("#")[0]) {
            var $target = $(target + ',[name="' + target.replace('#', '') + '"]');
            if ($target.length) {
                e.preventDefault();
                var scrollTime = Math.abs($target.offset().top - $('body').scrollTop()) / 2;
                $('html, body').stop().animate({
                    'scrollTop': $target.offset().top
                }, scrollTime, 'swing', function() {
                    window.location.hash = target;
                });

            }
        }
    });


    if ($('.simblaGallery figure, .simblaGallery.gallery-data').length > 0) {
        $.getScript("/static/js/lightbox.js");
        $('<link>')
            .appendTo('head')
            .attr({ type: 'text/css', rel: 'stylesheet' })
            .attr('href', '/static/css/lightbox.css');

        loadGalleryEffects();


    }

    $('.simblaGallery.gallery-data').each(loadGalleryData);

    $('.btn[id][class*="hvr-"]').each(function() {
        var cssProp = !$(this).hasClass('hvr-icon-fade') ? 'background-color' : 'color';
        var effectColor = LightenDarkenColor(colorToHex($(this).css(cssProp)), -40);
        createHoverEffectsCssRols($(this), effectColor);
        //createHoverEffectsCssRols($(this),LightenDarkenColor(colorToHex($(this).css('background-color')), -40));
    });
    setMinHeight();


    setSimblaLinkTop();
    window.addEventListener('touchstart', function videoStart() {
        $('.VideoBG .video-container video[autoplay]').each(function(video) {
            video.play();
        });
        this.removeEventListener('touchstart', videoStart);
    });

    $('form.loginForm .password-restore').click(simblaRestorePassword);

    $('.logout a').on('click', function() {
        var T = $(this);
        Simbla.User.logOut().then(function() {
            var location = $('meta[name="page-source"]').attr('site');
            if (T.parent().attr('data-next-page'))
                location += "/" + T.parent().attr('data-next-page');
            window.location = location;
        });
        return false;
    });
    setAccessibilityHelper();

    $(document).on('click', '.db-form-add', function() {
        var main = $(this).closest('.simbla-table');
        var viewOption = main.data('edit-view') || "row";

        main.find('.db-add-edit-form:visible, tr.edit-row').remove();
        var form = main.find('.db-add-edit-form').last().clone();
        form.data('table', main);
        var captcha;
        if (form.find('.simblaRecaptcha').length != 0) {
            captcha = form.find('.simblaRecaptcha .captcha').empty();
            captcha.attr('id', captcha.attr('id') + Math.random())

        }
        switch (viewOption) {
            case 'modal':
                var modal = $('<div>').addClass('modal fade').attr('role', 'dialog').css('overflow', 'hidden');
                var content = $('<div>').addClass('modal-content');
                form.css('display', 'block');
                content.append(form);
                form.find('[type="submit"]').parent().css('min-width', '200px').css('float', 'right')
                    .prev().css('max-width', 'calc(100% - 200px')
                modal.append($('<div>').addClass('modal-dialog').append(content));
                modal.on('hidden.bs.modal', function(e) {
                    modal.remove();
                });
                $('body').append(modal);
                modal.modal('show');
                break;
            case 'newwindow':
                window.refreshTable = function() {
                    main.trigger('refresh');
                    window.refreshTable = null;
                };
                window.open($('[name="page-source"]').attr('site') + "/" + main.data('edit-view-page') + '?cls=' + main.data('simblaClass'));
                return;
                break;
            case 'hidetable':
                var tbl = main.find('.table-responsive, .paging-area, .db-form-add').fadeOut();
                form.insertBefore(tbl.first());

                break;
            case 'row':
            default:
                form.insertBefore(main.find('table').parent());
                break;
        }
        form.attr('data-simbla-class', main.data('simbla-class')).attr('onsubmit', 'return createSimblaObj(this)').fadeIn()
        if (captcha && !Simbla.User.current()) {
            var formCapId = grecaptcha.render(captcha.attr('id'), {
                'sitekey': reCaptchaKey
            });
            form.data('captcha', formCapId);
        } else form.find('.simblaRecaptcha').remove();

        if (form.find('.wysiwyg-editor').length > 0)
            form.find('.wysiwyg-editor').sceditor(sceditorSettings);
        setTimeout(function() {
            form.find('select.select-pointer.autocomplete:visible').each(select2);
        }, 500)


    }).on('click', '.db-form-cancel', function(e) {
        var T = $(this).closest('form');
        if (T.closest('.simbla-table').length == 1) {
            if (T.closest('.simbla-table').find('.table-responsive').is(':hidden')) {
                T.closest('.simbla-table').find('.table-responsive, .paging-area, .db-form-add').fadeIn();
                T.fadeOut($(this).remove)
            } else
                $(this).parents('.db-add-edit-form, tr.edit-row').remove();

        } else
            $(this).closest('.modal').modal('hide')
        return false;
    }).on('click', '.simbla-table td.action .fa-pencil', function() {
        var main = $(this).closest('.simbla-table');
        var viewOption = main.data('edit-view') || "row";
        var tr = $(this).closest('tr');

        var obj = tr.data('val');

        main.find('.db-add-edit-form:visible, tr.edit-row').remove();
        var form = main.find('.db-add-edit-form').last().clone().attr('data-simbla-class', main.data('simbla-class')).attr('onsubmit', 'return createSimblaObj(this)');
        form.find('.simblaRecaptcha').remove();
        form.data('table', main);
        switch (viewOption) {
            case 'modal':
                var modal = $('<div>').addClass('modal fade').attr('role', 'dialog').css('overflow', 'hidden');
                var content = $('<div>').addClass('modal-content');
                form.css('display', 'block');
                content.append(form);
                form.find('[type="submit"]').parent().css('min-width', '200px').css('float', 'right')
                    .prev().css('max-width', 'calc(100% - 200px')
                modal.append($('<div>').addClass('modal-dialog').append(content));
                modal.on('hidden.bs.modal', function(e) {
                    modal.remove();
                });
                $('body').append(modal);
                modal.modal('show');
                break;
            case 'hidetable':
                var tbl = main.find('.table-responsive, .paging-area, .db-form-add').fadeOut();
                form.insertBefore(tbl.first()).attr('data-simbla-class', main.data('simbla-class')).attr('onsubmit', 'return createSimblaObj(this)').fadeIn()

                break;
            case 'newwindow':
                window.refreshTable = function() {
                    main.trigger('refresh');
                    window.refreshTable = null;
                };
                window.open($('[name="page-source"]').attr('site') + "/" + main.data('edit-view-page') + '?oid=' + obj.id + '&cls=' + main.data('simblaClass'));
                return;
                break;
            case 'row':
            default:
                form.css('max-width', main.width() - 10);
                var td = tr.find('td')
                var row = $('<tr>').addClass('edit-row')
                    .append($('<td>').css('border-top', '0').css('border-color', td.css('border-color')).attr('colspan', td.length).append(form));
                if (main.find('table').is('.table-striped')) {
                    row.find('td').css('background-color', td.eq(0).css('background-color'))

                    main.find('td').each(function() {
                        $(this).css('background-color', $(this).css('background-color'));
                    });
                }
                row.insertAfter(tr);
                form.fadeIn();
                break;


        }

        form.data('val', obj);
        if (form.find('.wysiwyg-editor').length > 0)
            form.find('.wysiwyg-editor').sceditor(sceditorSettings);
        setTimeout(function() {
            form.find('select.select-pointer.autocomplete:visible').each(select2);
        }, 500)
        setDataToForm(obj, form);
        obj.fetch().then(function(e) {
            form.data('val', e);
            setDataToForm(e, form);
        });

    }).on('click', '.simbla-table td.action .fa-trash', function() {
        var T = $(this);
        showAlert('Are you sure you want to delete this object?', 'Delete', function() {
            var tr = T.closest('tr');
            var obj = tr.data('val');
            obj.destroy().then(function() {
                tr.next('.edit-row').remove();
                tr.remove();
            }).fail(showAlert)
        });
    });

    if ($('.simbla-wrapper').length != 0) {
        function setFirstLiPadding() {
            if (menu.find('li').length > 5)
                menu.css('padding', li.is(':visible') ? '0 30px 8px' : '0 0 8px');

        }
        $('#linkToSimbla').hide();

        $(window).on('resize orientationchange', function() {
            if (screen.width > screen.height) return;
            //$('.simbla-wrapper').css('display', 'block')
            setTimeout(function() {
                setFirstLiPadding()
                setMinHeight();
                //$('.simbla-wrapper').css('display', 'flex');
            }, 500)
        });
        var menu = $('.simbla-wrapper>nav .nav.navbar-nav');
        if (menu.find('li').length > 5) {

            var li = $('<li>').addClass('scroll').append($('<span>').addClass('fa fa-angle-left'))
            menu.append(li, li.clone().find('.fa').attr('class', 'fa fa-angle-right').parent())
            setFirstLiPadding()
            var timer, timer2;
            menu.on('mousedown', 'li.scroll', function(e) {
                var T = $(this);
                var val = 0;
                if ($(this).find('span.fa-angle-right').length == 1) {
                    val += 10;
                } else {
                    val -= 10;
                }
                clearInterval(timer);
                menu.scrollLeft(menu.scrollLeft() + val)

                timer = setInterval(function() {
                    menu.scrollLeft(menu.scrollLeft() + val)
                }, 30);

                function setEnd() {
                    timer2 = setTimeout(function() {
                        if (T.is(':active')) {
                            setEnd();
                            return;
                        }
                        if (timer)
                            clearInterval(timer);
                    }, 1000);
                }
                setEnd();
                e.preventDefault();
                return false;

            });
            menu.on('mouseup', function(e) {
                if (timer)
                    clearInterval(timer);
                if (timer2)
                    clearTimeout(timer2);
                e.preventDefault();
                return false;
            })
        }
    }

    function getConversationPrefix() {
        var d = new Date();
        var user = "";
        if (Simbla.User.current())
            user = Simbla.User.current().get("name") + " ";
        return user + d.toLocaleString() + ": ";
    }
    $(document).on('keydown', 'input.conversation-input.form-control', function(e) {
        if (e.keyCode != 13) return;
        var input = $(this);
        var textarea = input.next().next();
        var prefix = getConversationPrefix();
        textarea.val(prefix + input.val() + "\n" + textarea.val());
        input.val("");
        e.preventDefault();
    });
    $(document).on('click', 'input.conversation-input.form-control + span', function() {
        var input = $(this).prev();
        if (input.val() == "") return;
        var textarea = $(this).next();
        var prefix = getConversationPrefix();
        textarea.val(prefix + input.val() + "\n" + textarea.val())
        input.val("");
    })

    if (QueryString.oid && $('.simblaEL.dbForm[data-simbla-class="' + QueryString.cls + '"]').length > 0) {
        var form = $('.simblaEL.dbForm[data-simbla-class="' + QueryString.cls + '"]');
        var obj = new(Simbla.Object.extend(QueryString.cls));
        obj.id = QueryString.oid;
        obj.fetch(function(o) {
            //form.find('.simblaRecaptcha').remove();
            form.data('val', o);
            setDataToForm(o, form);
        })
    }



    setGroupIdHeight()
    if ($('.wysiwyg-editor:visible').length > 0)
        $('.wysiwyg-editor:visible').sceditor(sceditorSettings);
    $('select.select-pointer:not(.autocomplete):not([disabled])').each(function() {
        var T = $(this);
        var target = T.attr('targetclass')
        if (target) {
            var q = new Simbla.Query(target)
            q.select.apply(q, TextKeys).find().then(function(d) {
                T.empty();
                T.append($('<option>'));
                d.forEach(function(o) {

                    T.append($('<option>').attr('value', o.id).text(getTextKeyValue(o)));
                });

                T.val(T.data('val') || T.attr('val')).on('change', function() {
                    $(this).removeAttr('val')
                });

            })
        }

    })
    $('select.select-pointer.autocomplete:visible').each(select2);
}); //end of document ready
var select2cach = {};
var selectTimeout

function select2() {
    var T = $(this);
    var target = T.attr('targetclass')
    if (target) {
        var textKey;
        T.select2({
            theme: "bootstrap",
            debug: false,
            placeholder: T.attr('placeholder'),
            ajax: {
                transport: function(params, success, failure) {
                    var qs = params.data.q;
                    var cachString = (qs || "__empty__").toLowerCase();

                    if (select2cach[target] && select2cach[target][cachString])
                        return success(select2cach[target][cachString]);
                    clearTimeout(selectTimeout)
                    selectTimeout = setTimeout(function() {
                        var q = new Simbla.Query(target);
                        if (qs) {
                            var reg = new RegExp("\\Q" + qs + "\\E", 'i');
                            if (textKey) {

                                q.matches(textKey, reg);
                            } else {
                                var qa = []
                                TextKeys.forEach(function(k) {
                                    var q = new Simbla.Query(target);
                                    q.matches(k, reg);
                                    qa.push(q);

                                });
                                q = Simbla.Query.or.apply(this, qa);

                            }
                        }
                        q.select.apply(q, TextKeys).limit(15).find().then(function(d) {
                            var data = {
                                results: d.map(function(o) {
                                    return { id: o.id, text: getTextKeyValue(o) };
                                })
                            };
                            success(data);
                            if (!select2cach[target]) select2cach[target] = {};
                            select2cach[target][cachString] = data;
                            if (d.length > 0 && !textKey) {
                                TextKeys.some(function(k) {
                                    if (d[0].get(k)) {
                                        textKey = k;
                                        return true;
                                    }
                                });
                            }
                        }, failure);
                    }, 500);

                }
            }
        });
    }
}
var sceditorSettings = {
    plugins: "xhtml",
    width: "100%",
    height: "100%",
    autoUpdate: true,
    rtl: $('#windowDiv').is('.rtl'),
    style: "//d33rxv6e3thba6.cloudfront.net/asset/sites/sceditor/minified/jquery.sceditor.default.min.css",
    emoticonsRoot: "//d33rxv6e3thba6.cloudfront.net/asset/sites/sceditor/"
}

$(window).load(loadRefresh);

function loadRefresh() {
    if ($('.simblaHeader.sticky').length > 0) {
        $('#bodyContainer').css('margin-top', $('.simblaHeader.sticky').outerHeight());
    }
    $('body').on('click', '.side-toggle', function() {
        $(this).closest('nav').toggleClass('change-width');
    });
    $('header.sticky').each(function() {

        var T = $(this);

        var slideType = T.data('slide-type');
        var offset = T.offset();
        if (slideType == "slide") {
            T.data('topoffset', offset.top + T.outerHeight());
        } else {
            T.data('topoffset', offset.top);
        }
        if (offset.left > 0)
            T.data('leftoffset', offset.left);


    });

    setTimeout(function() {

        var newHeight;
        if ($('.simblaFooter:not(".sticky")').length == 1 && (winDiv.height() + $('.simblaFooter').outerHeight()) > window.innerHeight) {
            winDiv.height(winDiv.height() + $('.simblaFooter').outerHeight());
        } else if (winDiv.height() < window.innerHeight) {
            newHeight = window.innerHeight - $('.sticky').height();
            winDiv.css('height', newHeight + 'px');
        }

        //var stickyHeight = $('.sticky').not('[class*="minHeight"] .sticky').height() || 0;
        setSimblaLinkTop();
        setGroupIdHeight();

    }, 200);
}

window.addEventListener("orientationchange", function() {
    setMinHeight();
}, false);

function setSimblaLinkTop() {


    var linkTop = Math.max(winDiv.height(), window.innerHeight, $('#bodyContainer').height()) - 20;
    simblaLink.css('top', linkTop + 'px');

}

function setAccessibilityHelper() {
    listenToAccessibilityClick();
    if (localStorage["accessFlicker"] && $('.accessibility').attr('flicker'))
        blockFlicker();
    if (localStorage["accessTextSize"] && $('.accessibility').attr('TextSize'))
        blockTextSize();
    if (localStorage["accessKeyboard"] && $('.accessibility').attr('Keyboard'))
        blockKeyboard();
    if (localStorage["accessGreyscale"] && $('.accessibility').attr('Greyscale'))
        blockGreyscale();
    if (localStorage["accessInvert"] && $('.accessibility').attr('Invert'))
        blockInvert();
}

function listenToAccessibilityClick() {

    $('.accessibility').click(function() {
        var T = $(this);

        T.blur();
        if ($('.accessibilityToolTip').length > 0) {
            T.attr('style', T.attr('origin-css'));

            return $('.accessibilityToolTip').remove();
        }

        function createField(prop) {
            var view = $('<div class="control">');

            var checkbox = $('<input type="checkbox"/>').prop('name', prop);
            if (localStorage["access" + prop] == "true")
                checkbox.prop('checked', true);
            var span = $('<span>').text(T.attr(prop.toLowerCase()));
            view.append($('<label>').append(checkbox, span));

            return view;
        }

        var toolTip = $('<div class="accessibilityToolTip">');

        var header = $('<div class="tooltip-title">');
        var close = $('<div class="close">');
        close.on('click', function() {
            $('.accessibilityToolTip').fadeOut(300, function() {
                $('.accessibilityToolTip').remove();
            });
        });
        header.append(close, $('<span>').text(T.text()));
        toolTip.append(header);

        if (T.attr('flicker'))
            toolTip.append(createField('Flicker'));
        if (T.attr('textsize'))
            toolTip.append(createField('TextSize'));
        if (T.attr('keyboard'))
            toolTip.append(createField('Keyboard'));
        if (T.attr('greyscale'))
            toolTip.append(createField('Greyscale'));
        if (T.attr('invert'))
            toolTip.append(createField('Invert'));


        var applyBtn = $('<button id="set" class="sub" title="Apply">').tooltip();
        var resetBtn = $('<button id="reset" class="sub"  title="Reset">').tooltip();
        toolTip.append($('<div id="sub-ctrl">').append(applyBtn, resetBtn));
        var position = T.offset();


        toolTip.css({
            //background: $(this).css('background'),
            //minWidth: $(this).outerWidth(),
            top: position.top, // + T.outerHeight(),
            left: position.left


        });
        if (winDiv.hasClass('rtl'))
            toolTip.addClass('rtl');

        toolTip.on('click', '#set', function() {
            localStorage.removeItem("accessFlicker");
            localStorage.removeItem("accessTextSize");
            localStorage.removeItem("accessKeyboard");
            localStorage.removeItem("accessGreyscale");
            localStorage.removeItem("accessInvert");

            toolTip.find('input:checked').each(function() {
                localStorage.setItem("access" + $(this).attr('name'), "true");
            });

            toolTip.hide();
            location.reload();
        });
        toolTip.on('click', '#reset', function() {
            localStorage.removeItem("accessFlashes");
            localStorage.removeItem("accessTextSize");
            localStorage.removeItem("accessKeyboard");
            localStorage.removeItem("accessGreyscale");
            localStorage.removeItem("accessInvert");

            toolTip.hide();
            location.reload();
        });
        $('body').append(toolTip);

        var top = position.top; // + T.outerHeight();

        if (top + toolTip.outerHeight() > winDiv.height()) {
            top = position.top - toolTip.outerHeight();
        }


        var left = position.left;
        while (left + toolTip.outerWidth() > winDiv.width())
            --left;
        toolTip.css({

            top: top,
            left: left


        });
        toolTip.animate({ 'opacity': '1' });


    });

}

function blockFlicker() {
    $('video').each(function() {
        this.pause();
    });
    $('.carousel').carousel('pause');
    //$('*').css('animation', 'none');

}

function blockTextSize() {
    $('h1, h2, h3, h4, h5, h6, label, span, a, button, input, p').each(function() {
        if ($(this).parents('h1, h2, h3, h4, h5, h6, label, span, a, button, input, p').length == 0)
            $(this).css('font-size', parseInt($(this).css('font-size'), 10) * 1.5)
    });
}

function blockKeyboard() {
    var lin = document.createElement('link');
    lin.setAttribute('rel', 'stylesheet');
    lin.setAttribute('type', 'text/css');
    lin.setAttribute('href', '/static/css/bootstrap-accessibility.css');
    document.getElementsByTagName('head')[0].appendChild(lin);
    var script = document.createElement('script');
    script.src = '/static/js/bootstrap-accessibility.min.js';
    document.getElementsByTagName('head')[0].appendChild(script);
}
var _hasTooltip;

function addTooltip() {
    if (_hasTooltip) return;
    $('h1, h2, h3, h4, h5, h6, label, span, a, button, input p').each(function() {
        if ($(this).parents('h1, h2, h3, h4, h5, h6, label, span, a, button, input, p').length == 0)
            $(this).tooltip({
                placement: "auto top",
                title: function() {

                    var T = $(this);
                    if (T.is('input')) {

                        if (T.is('[type="text"], [type="email"]'))
                            return T.attr('placeholder');
                        else
                            return T.attr('name');
                    }
                    return $(this).text();
                }
            });
    });
    _hasTooltip = true;
}

function blockInvert() {
    var i = 'invert(100%)';
    $('body').css({
        'filter': i,
        '-webkit-filter': i,
        '-moz-filter': i,
        '-o-filter': i,
        '-ms-filter': i

    });
    addTooltip();

}

function blockGreyscale() {
    var i = 'grayscale(100%)'; //'invert(100%)';
    $('body').css({
        'filter': i,
        '-webkit-filter': i,
        '-moz-filter': i,
        '-o-filter': i,
        '-ms-filter': i

    });
    addTooltip();

}

function createHtmlModal(title, html, confirm, cb, modalCloseCb) {
    $('.html-modal').modal('hide')
    var modal = $('<div>').addClass('modal fade html-modal').attr('role', 'dialog').css('overflow', 'hidden');
    var header = $('<div class="widget-header modal-header">');
    header.append($('<h4>').text(title));
    var content = $('<form>').addClass('modal-content');
    content.on('submit', function() {
        if (cb) cb();
        else $('.html-modal').modal('hide');
        return false;
    });
    content.append(header, $('<div>').addClass('modal-body').append(html));
    var close = $('<button>').attr('type', 'button')
        .addClass('btn btn-default')
        .attr('data-dismiss', 'modal').text("Close");
    var confBtn;
    if (confirm) {
        close.attr('bs-btn', '');
        confBtn = close.clone().addClass('btn-success')
            .removeAttr('data-dismiss')
            .attr('type', 'submit')
            .text(confirm);
        //confBtn.on('click', cb)

    }
    content.append($('<div>').addClass('modal-footer').append($('<div>').addClass(!confirm ? 'text-center' : '').append(confBtn, close)));

    modal.append($('<div>').addClass('modal-dialog').append(content));

    modal.on('hidden.bs.modal', function(e) {
        modal.remove();
        modalCloseCb && modalCloseCb()
    });
    $('body').append(modal);
    modal.modal('show');

}

function createAppsHeader() {

    var wrap = $('<div>').addClass('apps-wrapper');
    $('.content,nav').on('click', function(e) {
        if ($(e.target).closest('ul.apps-menu-toggle').length == 0 && wrap.find('ul.apps-menu-toggle:visible').length == 1) {
            wrap.find('ul.apps-menu-toggle').fadeOut();
        }
        if ($(e.target).closest('user-menu').length == 0 && wrap.find('ul.user-menu:visible').length == 1) {
            wrap.find('ul.user-menu').fadeOut();
        }
    })


    var appsView = $('<div>').addClass('apps-view');
    var appsIcon = $('<span>').addClass('fa fa-th');
    var dropApps = $('<ul>').addClass('apps-menu-toggle')

    appsView.on('click', function() {
        userMenu && userMenu.hide();
        dropApps.toggle();
        if (dropApps.find('li').length == 0) {
            $.get('/getSiteMarketApps/' + $('meta[name="page-source"]').attr('site-id'), function(data) {
                data.forEach(function(app) {
                    var li = $('<li>');
                    var icon = $('<span>').addClass('fa').addClass(app.marketApp.icon).css('background', app.marketApp.color)

                    li.append(icon, $('<span>').addClass('title').text(app.marketApp.name));
                    li.on('click', function() {
                        window.location = $('meta[name="page-source"]').attr('site') + '/apps/' + app.marketApp.name + '/' + (app.marketApp.mainPage || "dashboard");
                    })
                    dropApps.append(li);

                })
            })
        }
    });

    appsView.append(appsIcon, dropApps);

    var appData = {
        name: appMeta.attr('app-name'),
        color: appMeta.attr('color'),
        icon: appMeta.attr('icon'),
        mainPage: appMeta.attr('main-page')
    };
    var logoView = $('<div>').addClass('logo-view').attr('href', appData.mainPage);
    var logoIcon = $('<span>').addClass('fa').addClass(appData.icon).css('background-color', appData.color);
    var logoTitle = $('<span>').addClass('logo-title');

    var appTitle = $('<span>').addClass('logo-app-title').text(appData.name);
    logoView.append(logoIcon, logoTitle, appTitle);

    wrap.append(logoView, appsView);
    var User = Simbla.User.current();
    var userMenu;
    if (User) {
        var userView = $('<div>').addClass('apps-user');
        //var userThumb = $('<div />').addClass('user-thumb');
        var userName = $('<span>').addClass('user-name');

        userName.text(User.get('name'));
        //if (User.get("profile_image"))
        //userThumb.css('background-image', 'url(' + User.get("profile_image").url() + ')');

        var drop = $('<span>').addClass('user-menu-toggle')
        userMenu = $('<ul>').addClass('user-menu');
        var changePass = $('<li>').append($('<a>').text("Change password").on('click', function() {

            var group = $('<div>').append($('<label>').attr('for', 'oldpassword').text('Current password'), $('<input type="password" name="oldpass" />'))
            var group1 = $('<div>').append($('<label>').attr('for', 'newpassword').text('New password'), $('<input type="password" name="newpass"  />'))
            var group2 = $('<div>').append($('<label>').attr('for', 'repeatpassword').text('Repeat new password'), $('<input type="password" name="repeatpass"  />'))

            var html = $('<div>').append(group, group1, group2);
            html.find('>div').each(function() {
                $(this).addClass('form-group');
                var inp = $(this).find('input')
                var lbl = $(this).find('label');
                inp.attr('id', lbl.attr('for'))
                    .addClass('form-control')
                    .prop('required', true)
                    .attr('placeholder', lbl.text())
                    .css('width', '300px')

            })
            var userEmail = Simbla.User.current().get("username");

            function showError(m) {
                html.find('.simbla-form').remove();
                html.append('<div class="text-danger simbla-form"><label>' + m + '</label></div>');


                return false;
            }
            createHtmlModal("Change password", html, "Save", function() {
                html.find('.text-danger').remove();
                var old = html.find('input[name="oldpass"]').val();
                var newPass = html.find('input[name="newpass"]').val();
                var repeatpass = html.find('input[name="repeatpass"]').val();
                if (newPass != repeatpass)
                    return showError("Password's are not equal")

                var spin = $('<div class="simbla-form"><i class="simbla-loader-min"></i></div>');
                html.append(spin);

                Simbla.User.logIn(userEmail, old).then(
                    function(user) {

                        user.set("password", newPass)
                        user.save().then(function() {
                            spin.remove();
                            $('.html-modal').modal('hide');
                        }, function(error) {
                            showError(error.message);
                        });
                    },
                    function(error) {
                        showError(error.message);
                    }
                );

                return false;
            }, function() {

                if (!Simbla.User.current())
                    location.reload();

            });

        }));
        var logOut = $('<li>').append($('<a>').append($('<span>').addClass('fa fa-sign-in'), $('<span>').text("Log out"))
            .on('click', function() { Simbla.User.logOut().then(location.reload()) }));

        userMenu.append(changePass, logOut);
        userView.append( /*userThumb,*/ userName, drop, userMenu);
        userView.on('click', function() {
            dropApps.hide();
            userMenu.toggle();
        })
        wrap.append(userView);
    }

    $('.simbla-wrapper header').empty().append(wrap)

}
var appMeta = $('meta[name="market-app"]');
if (appMeta.length != 0) createAppsHeader();