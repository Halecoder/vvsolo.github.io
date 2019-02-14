
function isType(type) {
	return function(obj) {
		return {}.toString.call(obj) == "[object " + type + "]";
	}
}
var isArray = isType("Array"),
	isString = isType("String"),
	isObject = isType("Object")

// ����������ֵ
Object.extend = function(a, b) {
	for (var i in b) a[i] = b[i]
	return a
}

// ѭ���滻
var __fmts = function(re, args) {
	if (isArray(re) || isObject(re)) {
		for(var item in re) {
			var tmp = re[item]
			re[item] = !isString(tmp) ? __fmts(tmp, args) : tmp.fmt(args);
		}
	}
	return re;
}
Array.prototype.fmts = function(args) {
	return __fmts(this, args)
}

// ɾ���ַ���β�ո�
var Space = "\x09\x0B\x0C\x20\u1680\u180E\u2000\u2001\u2002\u2003" +
	"\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u200B\u202F\u205F\u3000\u2028" +
	"\u2029\uE4C6\uF8F5\uE004\uF04A\uFEFF"
var allSpace = Space + '\x0A\x0D\xA0'
//var regEscape = /([\\`\*_\{\}\[\]\(\)\>\#\+\-\.\!])/g
var regEscape = /([.?*+^$[\]\\(){}|-])/g

// ***** ��չ�ַ����� *****
Object.extend(String.prototype, {
	// ����Ϊ�����ַ���
	regEscape: function() {
		return this.replace(regEscape, "\\$1").replace(/\\+/g, "\\")
	},
	// ����Ϊ�����ַ���
	regSafe: function() {
		return this.replace(/\\+/g, "\\")
	},
	// ��ȫת������
	getReg: function(m) {
		return new RegExp(this.regSafe(), m || 'g')
	},
	// �������л���Ϊ UNIX ��׼
	toUNIX: function() {
		return this.replace(/\r/g, '\n')
	},
	// ��ʽ�����пո���ʽΪ��׼
	space: function() {
		return String(this).replace(new RegExp('[' + Space + ']+', 'g'), ' ').toUNIX()
	},
	// ɾ���ַ���β�ո�
	trim: function() {
		var ws = '[' + Space + ']+'
		return String(this).replace(new RegExp('^' + ws, 'gm'), '').replace(new RegExp(ws + '$', 'gm'), '')
	},
	// ȥ�����пո��ĳ���
	checkEmpty: function() {
		return this.replace(new RegExp('[' + allSpace + ']', 'g'), '').length === 0
	},
	// ѭ�������滻
	replaces: function(arr) {
		var re = this, i
		for (i in arr) {
			var tm = arr[i][0]
			// �ж��Ƿ�����
			isString(tm) && (tm = tm.getReg())
			re = re.replace(tm, arr[i][1])
		}
		return re
	},
	// �ַ�����λ�滻
	replaceAt: function(arr) {
		return this.replace(('([' + arr[0] + '])').getReg(), function(m) {
			return arr[1].charAt(arr[0].indexOf(m))
		})
	},
	// ȡ˫�ֽ��뵥�ֽڻ���ʱ����ʵ����
	len: function() {
		return this.replace(/[^\x00-\xff]/g, '**').length
	},
	// ����ʵ�������зָ�
	realSubstring: function(start, len) {
		var str = this || ''
		if (str.length === 0) return str
		start = start || 0
		len = len || str.len()
		var byteL = 0, sub = ''
		for (var i = c = cl = 0; i < str.length; i++) {
			c = str.charCodeAt(i)
			cl = c > 0xff ? 2 : 1
			byteL += cl
			//��������ʼλ
			if (start >= byteL) continue

			if (
				(len == str.len()) //ȡ��
				||
				((len -= cl) >= 0) //ȡ����ʱ������
			) {
				sub += String.fromCharCode(c)
			} else { //ȡ����
				break
			}
		}
		return sub
	},
	// �ظ������ַ���
	times: function(m) {
		return m < 1 ? '' : new Array(m + 1).join(this);
	},
	// ȡ�����ѯƥ��Ĵ���
	findCount: function(reg) {
		var re = this.match(reg)
		return (re !== null) ? re.length : 0;
	},
	// ������ĸ��д
	matchUpper: function(reg) {
		return this.replace(reg, function(m) {
			return m.toUpperCase()
		})
	},
	// ������ĸСд
	matchLower: function(reg) {
		return this.replace(reg, function(m) {
			return m.toLowerCase()
		})
	},
	// ���ⷽʽ�滻�ַ���
	/*
	 * arrs = {name:"loogn",age:22,sex:['man', 'woman']}
	 * var result0 = "����{$name}��{$sex.0}������{$age}��".fmt(arrs)
	 */
	fmt: function(args, r) {
		if (isString(args))
			return this.replace(/\{\$zz\}/g, args);
		if (!isObject(args) && !isArray(args))
			return this;
		var re = this;
		r = r || ''
		// ������ /\{\$([a-z0-9\.]+)}/gi
		if (/\{\$([a-z0-9\.\-\_]+)}/gi.test(re)) {
			re = re
				// ����������{$name.t1.0}
				.replace(/\{\$([\w\-]+)\.([\d]{1,2}|[\w\.\-]{1,})\}/g, function(m, m1, m2) {
					// ���������������ѭ
					var tmp = !/\./g.test(m2) ? args[m1][m2] : m.replace(('\{\$' + m1 + '\.').getReg(), '\{\$').fmt(args[m1], r)
					return isArray(tmp) ? tmp.join(r) : (tmp != null ? tmp : m)
				})
				// ����
				.replace(/\{\$([\w\-]+)\}/g, function(m, m1) {
					var tmp = (args[m1] != null) ? args[m1] : m
					return isArray(tmp) ? tmp.join(r) : tmp
				})
		}
		return re;
	},
	// �滻����������ʽ
	fmtReg: function(args, f, r) {
		return this.fmt(args, r).getReg(f)
	}
});

// ***** ��չ���鴦�� *****
Object.extend(Array.prototype, {
	// �����ɢ����
	shuffle: function() {
		for (var j, x, i = this.length; i; j = parseInt(Math.random() * i), x = this[--i], this[i] = this[j], this[j] = x);
		return this;
	},
	// ���ȡ����
	getRandom: function() {
		return isArray(this) ? this[Math.floor(Math.random() * (this.length))] : '';
	}
});

// ***** ��չʱ�䴦�� *****
if(!Date.prototype.fmt) {
	// ��ʽ��ʱ��
	Date.prototype.fmt = function(d) {
		var o = {
			"M+": this.getMonth() + 1, //�·� 
			"d+": this.getDate(), //�� 
			"h+": this.getHours(), //Сʱ 
			"m+": this.getMinutes(), //�� 
			"s+": this.getSeconds(), //�� 
			"q+": Math.floor((this.getMonth() + 3) / 3), //���� 
			"S": this.getMilliseconds() //���� 
		};
		if (/(y+)/.test(d))
			d = d.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
		for (var k in o) {
			if (new RegExp("(" + k + ")").test(d))
				d = d.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
		}
		return d;
	}
}

// ��ʽ������ 12,553.00
if (!Number.prototype.fmt) {
	Number.prototype.fmt = function() {
		// ��֤������ַ��Ƿ�Ϊ����
		if (isNaN(this)) return this
		return this.toLocaleString().replace(/\.00$/, '')
	}
}
