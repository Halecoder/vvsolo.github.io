// �ո� \uF604
var Space = "\\f\\t\\v\\x20\\u1680\\u180E\\u2000-\\u200B\\u202F\\u205F\\u3000\\u2028\\u2029\\uE4C6\\uF604\\uF8F5\\uE004\\uF04A\\uFEFF\\u202e\\u202c"
var allSpace = Space + '\\x0A\\x0D\\xA0'
//var regEscape = /([\\`\*_\{\}\[\]\(\)\>\#\+\-\.\!])/g
// *.?+$^[](){}|\/
var regEscapes = /([.?*+^$[\]\\(){}|-])/g

// �ж��Ƿ���ڣ�����Ϊ��
var checkNull = function(obj) {
	if (typeof obj === "undefined") return true
	if (obj === null) return true
	return false
}

// �ж�����
function isType(type) {
	return function(obj) {
		return Object.prototype.toString.call(obj) === "[object " + type + "]";
	}
}

var isArray = isType("Array"),
	isString = isType("String"),
	isObject = isType("Object"),
	isFunction = isType("Function")

// ����������ֵ
Object.extend = function(a, b) {
	for (var i in b) a[i] = b[i]
	return a
}


// ***** ��չ�ַ����� *****
Object.extend(String.prototype, {
	// ����Ϊ�����ַ���
	regEscape: function() {
		return this.replace(regEscapes, "\\$1").replace(/\u005c\u005c+/g, "\\")
	},
	// ��ȫת������
	getReg: function(m) {
		checkNull(m) && (m = 'g')
		return new RegExp(this.replace(/\u005c\u005c+/g, "\\"), m)
	},
	// �������л���Ϊ UNIX ��׼
	toUNIX: function() {
		return this.replace(/\r\n|\n\r|\r/g, '\n')
	},
	// ��ʽ�����пո���ʽΪ��׼
	space: function() {
		return this.replace(new RegExp('[' + Space + ']+', 'g'), ' ').toUNIX()
	},
	// ɾ���ַ���β�ո�
	trimSide: function() {
		return this.replace(/^[ ��]+/gm, '').replace(/[ ��]+$/gm, '')
	},
	// ɾ���ַ���β�ո�
	trim: function() {
		return this.space().trimSide()
	},
	// ɾ���ַ���β�ո񡢻���
	trims: function() {
		return this.trimSide().replace(/\n/g, '')
	},
	// ѭ�������滻���ɴ������
	replaces: function(arr) {
		var re = this
		if (isArray(arr)) {
			arr.each(function(v) {
				if (isArray(v)) {
					isString(v[0]) && (v[0] = v[0].getReg())
					re = re.replace(v[0], v[1] || '')
				} else {
					isString(v) && (v = v.getReg())
					re = re.replace(v, '')
				}
			})
		} else if (isObject(arr)) {
			for (var item in arr)
				re = re.replaces(arr[item])
		}
		return re
	},
	// �ַ�����λ�滻
	replaceAt: function(a, rev) {
		if (rev) a = [a[1], a[0]]
		return this.replace(new RegExp('[' + a[0] + ']', 'g'), function(m) {
			return a[1].charAt(a[0].indexOf(m))
		})
	},
	// ����ȥ���пո�
	cleanSpace: function(reg) {
		return reg ? this.replace(reg, function(m) {
			return m.replace(/\s/g, '')
		}) : this.replace(/\s/g, '')
	},
	// ȡ˫�ֽ��뵥�ֽڻ���ʱ����ʵ����
	len: function() {
		return this.replace(/[^\x00-\xff]/g, '**').length
	},
	// ����ʵ�������зָ�
	realSubstr: function(start, len) {
		var str = this || ''
		if (str.length === 0) return str
		start = start || 0
		len = len || str.len()
		var byteL = 0, sub = '',
			i = c = cl = 0, l = str.length
		for (; i < l; i++) {
			c = str.charCodeAt(i)
			cl = c > 0xff ? 2 : 1
			byteL += cl
			// ��������ʼλ
			if (start >= byteL) continue
			 // ȡ�� ȡ����ʱ������
			if (len == str.len() || (len -= cl) >= 0)
				sub += String.fromCharCode(c)
			else
				break;
		}
		return sub
	},
	// �ظ������ַ���
	times: function(m) {
		return m < 1 ? '' : new Array(m + 1).join(this);
	},
	// ȡ�����ѯƥ��Ĵ���
	findCount: function(reg) {
		isString(reg) && (reg = reg.getReg())
		var re = this.match(reg)
		return (re !== null) ? parseInt(re.length) : 0;
	},
	// ������ĸȫ��д
	matchUpper: function(reg) {
		return this.replace(reg, function(m) {
			return m.toUpperCase()
		})
	},
	// ��������ĸ��д
	matchFirstUpper: function(reg) {
		return this.matchUpper(/\b[a-z]/g)
	},
	// ������ĸСд
	matchLower: function(reg) {
		return this.replace(reg, function(m) {
			return m.toLowerCase()
		})
	},
	// ��������
	zeroize: function(b) {
		var n = this.replace(/^0+/g, '')
		if (b < 2) b = 2
		if (!/^[0-9]+$/.test(n) || b < n.length)
			return n

		n = '0'.times(b * 2) + n
		return n.substring(n.length - b)
	},
	// ���ⷽʽ�滻�ַ���
	/*
	 * arrs = {name:"loogn",age:22,sex:['man', 'woman']}
	 * var result0 = "����{$name}��{$sex.0}������{$age}��".fmt(arrs)
	 */
	fmt: function(args, r) {
		// �ַ���ʱ��ֱ���滻�����ǩ
		if (isString(args))
			return this.replace(/\{\$zz\}/g, args)
		if (!isObject(args) && !isArray(args))
			return this
		var val
		// �������ӷ���
		r = r || ''
		// ������ /\{\$([a-z0-9\.]+)}/gi
		return this
			// ����������{$name.t1.0}
			.replace(/\{\$([\w\-]+)\.([\d]{1,2}|[\w\.\-]{1,})\}/g, function(m, m1, m2) {
				if (!checkNull(args[m1])) {
					val = args[m1]
					// ���������������ѭ
					if (/\./g.test(m2))
						return m.replace(('\{\$' + m1 + '\.').getReg(), '\{\$').fmt(val, r)

					if (!checkNull(val[m2])) {
						val = val[m2]
						return isArray(val) ? val.join(r) : val
					}
				}
				return m
			})
			// ����
			.replace(/\{\$([\w\-]+)\}/g, function(m, m1) {
				if (!checkNull(args[m1])) {
					val = args[m1]
					return isArray(val) ? val.join(r) : val
				}
				return m
			})
	},
	// �滻����������ʽ
	fmtReg: function(args, f, r) {
		return this.fmt(args, r).getReg(f)
	},
	// ѭ����������
	eachRegTest: function(arr) {
		var isTrue = false, str = this
		if (isArray(arr)) {
			var l = arr.length, i = 0, v
			for (; i < l; i++) {
				v = arr[i]
				isTrue = isArray(v) ? str.eachRegTest(v) : v.test(str)
				if (isTrue)
					break;
			}
		} else if (isObject(arr)) {
			var tmp, v
			for (v in arr) {
				tmp = arr[v]
				isTrue = isArray(tmp) ? str.eachRegTest(tmp) : tmp.test(str)
				if (isTrue)
					return isTrue
			}
		}
		return isTrue
	}
});

// ***** ��չ���鴦�� *****
Object.extend(Array.prototype, {
	each: function(callback) {
		var l = this.length, i = 0
		for (; i < l; i++) {
			if (isFunction(callback) && callback.call(this[i], this[i], i) === false)
				break;
		}
	},
	map: function(callback) {
		var res = [], tmp
		this.each(function(v, i) {
			tmp = callback.call(v, v, i)
			if (tmp != null)
				res.push(tmp)
		})
		return res
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
