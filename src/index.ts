export type IncomingHeadersLike = Record<string, string | string[] | undefined>;

/**
 * An interface that is like the Node.js IncomingMessage shape without having to rely on the Node.js types.
 */
export interface IncomingMessageLike {
	url?: string | undefined;
	method?: string | undefined;
	headers?: IncomingHeadersLike | undefined;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	on(event: 'data', listener: (chunk: any) => void): this;
	on(event: 'end', listener: () => void): this;
	on(event: 'error', listener: (error: Error) => void): this;
}

export type Guard<T> = (value: unknown) => value is T;

export interface UniversalEndpointRouteHandler {
	method: AcceptedMethods;
	path: string;
	implementation: (input: unknown) => Promise<unknown>;
}

export class HTTPError extends Error {
	constructor(
		public status: number,
		public message: string
	) {
		super(message ? message : `HTTP error ${status}`);
	}
}

export interface HTTPResult {
	status: number;
	body: string;
}

const RequestSymbol = Symbol('request');

export type HTTPRequest<I> =
	| {
			payload: I;
			headers?: IncomingHeadersLike;
			[RequestSymbol]: true;
	  }
	| I;

export function wrapRequest<I>(request: HTTPRequest<I>, headers?: IncomingHeadersLike): HTTPRequest<I> {
	if (typeof request === 'object' && request !== null && RequestSymbol in request) {
		return { payload: request.payload, headers: { ...request.headers, ...headers }, [RequestSymbol]: true };
	}
	return { payload: request, headers: headers, [RequestSymbol]: true };
}

export function unwrapRequest<I>(request: HTTPRequest<I>): { payload: I; headers: IncomingHeadersLike } {
	if (typeof request === 'object' && request !== null && RequestSymbol in request) {
		return { payload: request.payload, headers: request.headers || {} };
	}
	return { payload: request, headers: {} };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class UniversalEndpoint<T extends { [index: string | number | symbol]: any }> {
	/**
	 * The base URL for the server running the service logic
	 */
	baseUrl = 'http://localhost';
	/**
	 * On the server side, you must attach a service logic instance to this property, which will
	 * be used to implement the endpoint methods.
	 */
	implementation: T | undefined = undefined;

	protected handlers: Record<string, UniversalEndpointRouteHandler> = {};

	/**
	 * Creates a new UniversalEndpoint instance and a corresponding endpoint decorator.
	 * You can use the decorator to decorate client class methods which will be converted to HTTP fetches.
	 *
	 *
	 *
	 * @returns An object with the UniversalEndpoint instance and the endpoint decorator.
	 */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	static create<T extends { [index: string | number | symbol]: any }>() {
		const ep = new UniversalEndpoint<T>();
		//ep.implementation = implementation;
		return {
			endpointInstance: ep,
			//put the contract sctructure here
			endpoint: <I, O>(
				method: AcceptedMethods,
				path: string,
				inputGuard: Guard<I> | undefined,
				outputGuard: Guard<O>
			) => ep.decorate(method, path, inputGuard, outputGuard)
		};
	}

	private completeWithParams<T>(input: Partial<T>, additionalData: Omit<T, keyof typeof input>): T {
		return { ...input, ...additionalData } as T;
	}

	async fetchEndpoint<I, O>(
		method: AcceptedMethods,
		path: string,
		request: HTTPRequest<I>,
		outputGuard: Guard<O>
	): Promise<O> {
		const unwrapped = unwrapRequest(request);
		const argMapping = mergeArguments(path, unwrapped.payload);

		const init: RequestInit = {
			method: method,
			headers: { 'Content-Type': 'application/json', ...unwrapped.headers }
		};
		if (argMapping.arg !== null && method !== 'GET') {
			init.body = JSON.stringify(argMapping.arg);
		}

		const response = await fetch(new URL(argMapping.path, this.baseUrl), init);
		if (!response.ok) {
			throw new HTTPError(response.status, response.statusText);
		}
		const result = await response.json();
		if (!outputGuard(result)) {
			throw new Error(`Invalid response from server: result`);
		}
		return result;
	}

	decorate<This, Return, Input = void>(
		method: AcceptedMethods,
		path: string,
		inputGuard: Guard<Input> | undefined,
		outputGuard: Guard<Return>
	) {
		// eslint-disable-next-line @typescript-eslint/no-this-alias
		const decoratorInstance = this;
		return function loggedMethod(
			target: (this: This, arg: HTTPRequest<Input>) => Promise<Return>,
			context: ClassMethodDecoratorContext<This, (this: This, arg: HTTPRequest<Input>) => Promise<Return>>
		) {
			const methodName = String(context.name);
			//console.log(`Decorating '${methodName}' with path '${path}'.`);
			const handler: UniversalEndpointRouteHandler = {
				method: method,
				path,
				implementation: async (i) => {
					if (inputGuard !== undefined && !inputGuard(unwrapRequest(i).payload))
						throw new HTTPError(400, `Invalid input: ${JSON.stringify(i)}`);
					const impl = decoratorInstance.implementation;
					if (!impl) {
						throw new HTTPError(501, 'Not implemented');
					}
					if (methodName in impl) {
						const method = impl[methodName];
						if (typeof method === 'function') {
							// call method with 'this' set to 'impl'
							return method.call(impl, i) as Promise<Return>;
						}
					}
					throw new HTTPError(501, 'Not implemented');
				}
			};
			decoratorInstance.handlers[path] = handler;

			// The replacement method ensures that types align with the target method.
			const replacementMethod = function (this: This, arg: HTTPRequest<Input>): Promise<Return> {
				//console.log(`Calling '${methodName}'`);
				return decoratorInstance.fetchEndpoint(method, path, arg, outputGuard);
			};

			return replacementMethod;
		};
	}

	handleIncomingRequest(req: IncomingMessageLike): Promise<HTTPResult> {
		const url = new URL(req.url || '', this.baseUrl);
		const handler = Object.values(this.handlers).find((h) => this.matchHandler(url.pathname, h.path));
		if (!handler || !isMethodEqualTo(req.method, handler.method)) {
			return Promise.reject(new HTTPError(404, 'Not Found'));
		}
		if (req.method === 'GET') return this.handlePathWithJson(req.method, url.pathname, null, req.headers);
		return requestBody(req).then((body) => this.handlePathWithBody(req.method, url.pathname, body, req.headers));
	}

	handlePathWithBody(
		method: string | undefined,
		path: string,
		body: string,
		headers?: IncomingHeadersLike
	): Promise<HTTPResult> {
		return jsonPromise(body).then((json) => this.handlePathWithJson(method, path, json, headers));
	}

	handlePathWithJson(
		method: string | undefined,
		path: string,
		json: unknown,
		headers?: IncomingHeadersLike
	): Promise<HTTPResult> {
		const handler = Object.values(this.handlers).find((h) => this.matchHandler(path, h.path));
		if (handler && isMethodEqualTo(method, handler.method)) {
			const payload = extractArguments(handler.path, path, json);

			return handler.implementation(wrapRequest(payload, headers ?? {})).then((result) => {
				return { status: 200, body: JSON.stringify(result) };
			});
		} else {
			return Promise.reject(new HTTPError(404, 'Not Found'));
		}
	}

	/**
	 * Determine if a path matches a handler path template (e.g. /foo/:param1/bar/:param2)
	 * @param path
	 * @param handlerPath
	 */
	matchHandler(path: string, handlerPath: string): boolean {
		// create a regex pattern from the handler path
		const pattern = new RegExp('^' + handlerPath.replace(/:[^/]+/g, '([^/]+)') + '$');
		return pattern.test(path);
	}
}

function extractArguments(
	path: string,
	urlPath: string,
	arg: unknown
): Primitive | Primitive[] | Record<string, Primitive> | null {
	const pathParts = path.split('/');
	const pathParams = pathParts.filter((part) => part.startsWith(':'));
	const urlParts = urlPath.split('/');

	// return null if arg is null and we do not have any params in path
	if (arg === null && pathParams.length === 0) return null;

	// return a primitive if arg is a primitive - we cannot really extend it with path params
	if (typeof arg !== 'object') return arg as Primitive;

	// return primitive if arg is null and we have exactly one param in path
	if (arg === null && pathParams.length === 1) {
		const idx = pathParts.indexOf(pathParams[0]);
		return parsePrimitive(urlParts[idx]);
	}

	// return an array if arg is an array, prepend with path params
	if (Array.isArray(arg)) {
		const args: Primitive[] = [];
		pathParts.forEach((part, idx) => {
			if (part.startsWith(':')) {
				args.push(parsePrimitive(urlParts[idx]));
			}
		});
		return [...args, ...arg];
	}

	// return an object if arg is an object or null, extend with path params
	const args: Record<string, Primitive> = arg === null ? {} : { ...arg };
	pathParts.forEach((part, idx) => {
		if (part.startsWith(':')) {
			const key = part.substring(1);
			args[key] = parsePrimitive(urlParts[idx]);
		}
	});
	return args;
}

function parsePrimitive(value: string): string | number | boolean {
	// check if the entire value is a boolean
	if (value === 'true' || value === 'false') {
		return value === 'true';
	}
	// check if the entire value is a number, allowing decimals and negative numbers
	if (/^-?\d*\.?\d+$/.test(value)) {
		return parseFloat(value);
	}
	return value;
}

interface MergeArgumentResult {
	arg: unknown;
	path: string;
}

/**
 * Moves argument(s) into path placeholders
 * @param path The path with placehodlers, eg. '/foo/:bar/:boo'
 * @param arg A primitive type, array or object to merge into the placeholders.
 *
 * If `arg` is primitive, the first
 * placeholder will be substituted with its value. If `arg` is an array, the placeholders will be substitued with
 * its elements in the same order, until either is exhausted (no more plcaeholders ot no more elements).
 *
 * If `arg` is an object, the placeholders will be substituted with the properties of the same name in the object.
 *
 * @returns A `MergeArgumentResult` object with a path into which the placeholders have been substituted and the
 * argument remainder that was not used in the substitution.
 */
function mergeArguments(path: string, arg: unknown): MergeArgumentResult {
	const result = { path, arg };
	const pathParams = path.split('/').filter((p) => p.startsWith(':'));
	if (typeof arg === 'string' || typeof arg === 'number' || typeof arg === 'boolean') {
		const part = pathParams[0];
		if (part !== undefined) return { path: result.path.replace(part, encodeURIComponent(arg)), arg: null };
	}
	if (Array.isArray(arg)) {
		const remainder: unknown[] = [];
		arg.forEach((a) => {
			const part = pathParams.shift();
			if (part !== undefined) result.path = result.path.replace(part, encodeURIComponent(a));
			else remainder.push(a);
		});
		result.arg = remainder;
		return result;
	}
	if (typeof arg === 'object' && arg !== null) {
		const remainder: Record<string, unknown> = {};
		Array.from(Object.entries(arg)).forEach(([key, value]) => {
			if (pathParams.includes(`:${key}`)) result.path = result.path.replace(`:${key}`, encodeURIComponent(value));
			else remainder[key] = value;
		});
		result.arg = remainder;
		return result;
	}
	return result;
}

function requestBody(req: IncomingMessageLike): Promise<string> {
	return new Promise((resolve, reject) => {
		let body = '';
		req.on('data', (chunk) => {
			body += chunk.toString();
		});
		req.on('end', () => {
			resolve(body);
		});
		req.on('error', (error) => {
			reject(new HTTPError(500, error.message));
		});
	});
}

function jsonPromise(data: string): Promise<unknown> {
	try {
		return Promise.resolve(JSON.parse(data));
	} catch (error) {
		const msg = error instanceof Error ? error.message : 'Invalid JSON';
		return Promise.reject(new HTTPError(400, msg));
	}
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function endpointStub<I, O>(request?: I): Promise<O> {
	return Promise.reject(new HTTPError(501, 'Not implemented'));
}

export type AcceptedMethods = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

function isMethodEqualTo(method: string | undefined, acceptedMethod: AcceptedMethods): boolean {
	if (method === undefined) return acceptedMethod === 'GET';
	return method.toLowerCase() === acceptedMethod.toLowerCase();
}

type Primitive = string | number | boolean;

type PrimitiveType = 'string' | 'number' | 'boolean';

type CompositeType = { [index: string]: PrimitiveType };

export function hasPrimitiveProp(obj: unknown, key: string, type: PrimitiveType): boolean {
	if (typeof obj !== 'object' || obj === null) return false;
	return typeof (obj as Record<string, unknown>)[key] === type;
}

export function hasGuardedProp<T>(obj: unknown, key: string, guard: Guard<T>): obj is Record<string, T> {
	if (typeof obj !== 'object' || obj === null) return false;
	return guard((obj as Record<string, unknown>)[key]);
}

export function hasPrimitiveProps(obj: unknown, props: CompositeType): boolean {
	if (typeof obj !== 'object' || obj === null) return false;
	return Object.entries(props).every(([key, type]) => hasPrimitiveProp(obj, key, type));
}

export function getGuardFor<T>(props: CompositeType): Guard<T> {
	return (value: unknown): value is T => hasPrimitiveProps(value, props);
}

export function stringGuard(value: unknown): value is string {
	return typeof value === 'string';
}

export function numberGuard(value: unknown): value is number {
	return typeof value === 'number';
}

export function booleanGuard(value: unknown): value is boolean {
	return typeof value === 'boolean';
}

export function arrayGuard<T>(guard: Guard<T>): Guard<T[]> {
	return (value: unknown): value is T[] => Array.isArray(value) && value.every(guard);
}
