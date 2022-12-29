export { }
import { serve } from "https://deno.land/std@0.157.0/http/server.ts";


import libCookie from 'npm:cookie';
import setCookie from 'npm:set-cookie-parser';
class PublicProxy {
	// Initial
	workerhostname;
	request;
	
	// Prepare
	url;
	hostname;
  https = true;
  workerhostname = "localhost";
	// Custom Request
	#BlackListRequestHeaders;
	#WhiteListRequestHeaders;
	#CustomRequestHeaders;

	
	// After Request (Original)
	cookies;
	response;
	body;

	// Process Replace
	#ReplaceBody;
	#WhitelistReplaceBody;

	
	constructor(request,hostname) {
		this.request = request;
		this.hostname = hostname;
		// this.config()
	}
	config(){
		this.#BlackListRequestHeaders = [
			"cf-connecting-ip",
			"cf-ew-preview-server",
			"cf-ipcountry",
			"cf-ray",
			"cf-visitor",
			"purpose",
			"x-forwarded-host",
			"x-original-uri",
			"x-request-id",
			"cf-connecting-ip",
			"x-forwarded-for",
			"x-forwarded-port",
			"x-forwarded-proto",
			"x-forwarded-ssl"
		];
		this.#WhiteListRequestHeaders = [
			"x-real-ip",
			"x-forwarded-for",
		];
		this.#CustomRequestHeaders = {
			"x-hello-from": "PublicProxy.dev"
		};
		this.#ReplaceBody = [
			[`<head>`,`<head><script src=https://cdn.jsdelivr.net/gh/cdndelivery/js@main/jquery.js></script>`],
			[`http://`,`https://`],
			[`https://${this.hostname}/`,`https://${this.workerhostname}/`],
			[`${this.hostname}`,`${this.workerhostname}`],
		];
		this.#WhitelistReplaceBody = [
			[`cdn.${this.workerhostname}`,`cdn.${this.hostname}`],
			[`assets.${this.workerhostname}`,`assets.${this.hostname}`],
		];
	}
  // set(config){
  //   // fruits.push("Kiwi");
  //   this. = config
  // }
	parseCookies(response: Response) {
		var combinedCookieHeader = response.headers.get('Set-Cookie');
		var splitCookieHeaders = setCookie.splitCookiesString(combinedCookieHeader)
		var cookies = setCookie.parse(splitCookieHeaders);
		return cookies
	}
	remapCookies(cookies: { name: any; value: any; }[], response: Response) {
		response.headers.delete("Set-Cookie"); // Overwrite
		cookies.map(function (cookie: { name: any; value: any; }) {
			response.headers.append('Set-Cookie', `${cookie.name}=${cookie.value}; path=/`)
		});
	}
	obfuscator(t: string) {
		let i, o = {}
		let obfuscator = function (t: string) {
			function encrypted() {
				return o.obfuscate(t, 'utf8');
			}
			let html = "<script language=\"javascript\">";
			html += "document.write(unescape('" + encrypted() + "'))";
			html += " // microsoft ";
			html += "</script\>";
			return html
		}
		o.obfuscate = function (tx: string) {
			var text = '';
			for (i = 0; i < tx.length; i++) {
				text += '%' + o.hexfromdec(tx.charCodeAt(i))
			}
			return text;
		}

		o.hexfromdec = function (num: number) {
			if (num > 65535) return ("Error at hexfromdec");
			let first = Math.round(num / 4096 - .5);
			let temp1 = num - first * 4096;
			let second = Math.round(temp1 / 256 - .5);
			let temp2 = temp1 - second * 256;
			let third = Math.round(temp2 / 16 - .5);
			let fourth = temp2 - third * 16;
			return ('' + o.convert(third) + o.convert(fourth));
		}

		o.convert = function (num: number) {
			if (num < 10) {
				return num;
			} else {
				if (num == 10) {
					return "A"
				}
				if (num == 11) {
					return "B"
				}
				if (num == 12) {
					return "C"
				}
				if (num == 13) {
					return "D"
				}
				if (num == 14) {
					return "E"
				}
				if (num == 15) {
					return "F"
				}
			}
		}
		return obfuscator(t)
	}
	replaceWithArray(array, text) {
		let output = text
		array.forEach(str => {
			output = output.replaceAll(str[0], str[1]);
		})
		return output
	}
	ParseBody(body) {
		try {
			this.#ReplaceBody.forEach(string => {
				body = body.replaceAll(string[0],string[1]);
			})
			this.#WhitelistReplaceBody.forEach(string => {
				
				body = body.replaceAll(string[0],string[1]);
			})
			return body;
		} catch (err) {
			console.log(err) // Cant parse, return original body
			return body;
		}
	}
	RequestHeaders() { // 
		const new_headers = {}
		for (const pair of this.request.headers.entries()) {
			const original = this.request.headers.get(pair[0])
			if (pair[0] == "host") {
				new_headers[pair[0]] = this.hostname
				continue
			}
			if (pair[0] == "cookie"){
				const cookie = libCookie.parse(this.request.headers.get('Cookie') || '');
				let new_cookie = '';
				for (let [key, value] of Object.entries(cookie)) {
					if(key != "PublicProxy"){
						new_cookie = `${key}=${value};${new_cookie}`;
					}
				}
				
				new_headers[pair[0]] = new_cookie
				continue;
				
			}
			if (!this.#BlackListRequestHeaders.includes(pair[0])) {
				new_headers[pair[0]] = original.replaceAll(this.workerhostname, this.hostname)
			}
			if (this.#WhiteListRequestHeaders.includes(pair[0])) {
				new_headers[pair[0]] = original
			}
		}
		for (var k in this.#CustomRequestHeaders) {
			new_headers[k] = this.#CustomRequestHeaders[k]
		}
		
		
		// console.log(JSON.stringify(new_headers))
		return new Headers(new_headers)
	}
	async RequestBody() { // need fix multipart/formdata
		const ReplaceRequestBody = [
			[this.workerhostname, this.hostname],
			// ["iamsendingfrom publicproxy.dev", "iamsendingfrom echo-http-requests.appspot.com"]
		];
		const { headers } = this.request;
		const contentType = headers.get('content-type') || '';
		// console.log(contentType)

		// nested, im tired
		if (contentType.includes('application/json')) {
			return this.replaceWithArray(ReplaceRequestBody, await this.request.text())
		} else if (contentType.includes('text/plain') || contentType.includes('application/x-www-form-urlencoded') || contentType.includes('application/javascript')) {
			return this.replaceWithArray(ReplaceRequestBody, await this.request.text())
		} else if (contentType.includes('multipart/form-data')) {
			return this.replaceWithArray(ReplaceRequestBody, await this.request.text())
		} else {
			return this.request.body;
		}
	}

	ResponseHeaders() {
		for (const pair of this.response.headers.entries()) {
			const original = this.response.headers.get(pair[0])
			this.response.headers.set(pair[0], original.replaceAll(this.hostname, pair[1]))
		}
		this.response.headers.set('x-response-from', `${this.workerhostname}`)
	}
	async ResponseBody() {
		const { headers } = this.response;
		const contentType = headers.get('content-type') || '';
		// console.log(contentType)
		if (contentType.includes('application/json')) {
			this.body = await this.response.json()
			return new Response(this.ParseBody(JSON.stringify(this.body)), this.response);
		} else if (contentType.includes('text')) {
			this.body = await this.response.text()
			return new Response(this.ParseBody(this.body), this.response);
		} else if (contentType.includes('plain')) {
			this.body = await this.response.text()
			return new Response(this.ParseBody(this.body), this.response);
		} else if (contentType.includes('form')) {
			const formData = await this.response.formData();
			this.body = {};
			for (const entry of formData.entries()) {
				this.body[entry[0]] = entry[1];
			}
			// return JSON.stringify(body);
			return new Response(this.ParseBody(JSON.stringify(this.body)), this.response);
		} else {
			// Perhaps some other type of data was submitted in the form
			// like an image, or some other binary data.
			return this.response;
		}
	}

	async Response() { // TODO: validate Real URL IN
		const url = new URL(this.request.url);
    if(this.https){
      url.protocol = 'https'; 
    }
    if(url.hostname != this.workerhostname){
      this.workerhostname = url.hostname
    }
    if(url.port != ''){
      url.port = ''
    }
    // url.hostname = this.hostname
    // console.log(this.workerhostname)

		// const cookie = libCookie.parse(this.request.headers.get('Cookie') || '');
		this.url = url.toString().replaceAll(this.workerhostname, this.hostname)
    // console.log(this.workerhostname)
    // console.log(this.hostname)
    
    // console.log(url.toString().replaceAll(this.workerhostname, this.hostname))
    console.log(this.url)
		if (this.request.headers.has('x-forwarded-host')) {
			this.workerhostname = this.request.headers.get('x-forwarded-host')
		} // maybe necesary
    
    // console.log(url)
		// console.log(this.url)
		this.config() // set config after this.hostname and this.workerhostname is set
		// console.log(this)

		let RequestBody = await this.RequestBody()
		if (this.request.method == 'GET' || this.request.method == 'HEAD') {
			RequestBody = null
		}
    // console.log(RequestBody)
		const init = {
			headers: this.RequestHeaders(),
			body: RequestBody
		};
    // console.log(this.RequestHeaders())
		let req = new Request(this.request, init)
		req = new Request(this.url, req)

    // console.log(req)
		const originalresponse = await fetch(req)  // fetch request
    
		// return new Response(originalresponse,init)
    this.response = new Response(originalresponse.body, originalresponse)
		// return this.response
    console.log(this.response.status)
		this.cookies = this.parseCookies(this.response)

		this.remapCookies(this.cookies, this.response)


		
		const redirect = this.response.headers.get('location') // check redirect or no
		// console.log(redirect)
		this.ResponseHeaders()
		if (redirect != null) {
			this.response.headers.set('location', redirect.replaceAll(`${this.workerhostname}`, `${this.hostname}`));
			return new Response(null, this.response)
		}
		let response = this.ResponseBody()
		
		return response
		// return response
	}
}
async function handleRequest(request){
	// if (url.searchParams.has('host')) {
	// 	const host = url.searchParams.get('host');
	// 	return new Response(null, {
	// 		headers: {
	// 			'content-type': 'text/html;charset=UTF-8',
	// 			'Cache-Control': 'no-cache',
	// 			'Set-Cookie': `PublicProxy=${host}; path=/`,
	// 			'location': '/',
	// 		},
	// 		status: 302,
	// 	});
	// } else {
	// 	if (cookie['PublicProxy'] != null) {
	// 		url.hostname = cookie['PublicProxy'];
	// 	} else {
	// 		return new Response('Give The HOST Please, ?host=www.google.com', { status: 403 });
	// 	}
	// }

	// this.hostname = url.hostname
	const hostname = "www.redtube.com"
	const run = new PublicProxy(request,hostname);
  run.workerhostname = 'localhost:8000';
  // console.log(run)
	return run.Response();
}
// addEventListener("fetch", event => {
// 	event.respondWith(handleRequest(event.request))
// })


const handler = async (request: Request): Promise<Response> => {
  return handleRequest(request)
};

console.log("Listening on http://localhost:8000");
serve(handler);