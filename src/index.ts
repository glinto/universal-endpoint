export type Guard<T> = (value: unknown) => value is T;

export interface UniversalEndpointRouteHandler {
	path: string;
	implementation: (input: unknown) => Promise<unknown>;
}

class HTTPError extends Error {
	constructor(
		public status: number,
		public message: string
	) {
		super(message ? message : `HTTP error ${status}`);
	}
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class UniversalEndpoint<T extends { [index: string | number | symbol]: any }> {
	baseUrl = 'http://localhost';
	implementation: T | undefined = undefined;
	handlers: Record<string, UniversalEndpointRouteHandler> = {};

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	static create<T extends { [index: string | number | symbol]: any }>() {
		const ep = new UniversalEndpoint<T>();
		//ep.implementation = implementation;
		return {
			universalEndpoint: ep,
			endpoint: <I, O>(path: string, inputGuard: Guard<I>, outputGuard: Guard<O>) =>
				ep.decorate(path, inputGuard, outputGuard)
		};
	}

	async fetchEndpoint<I, O>(path: string, request: I, outputGuard: Guard<O>): Promise<O> {
		const response = await fetch(new URL(path, this.baseUrl), {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(request)
		});
		if (!response.ok) {
			throw new HTTPError(response.status, response.statusText);
		}
		const result = await response.json();
		if (!outputGuard(result)) {
			throw new Error(`Invalid response from server: result`);
		}
		return result;
	}

	decorate<This, Input, Return>(path: string, inputGuard: Guard<Input>, outputGuard: Guard<Return>) {
		// eslint-disable-next-line @typescript-eslint/no-this-alias
		const decoratorInstance = this;
		return function loggedMethod(
			target: (this: This, arg: Input) => Promise<Return>,
			context: ClassMethodDecoratorContext<This, (this: This, arg: Input) => Promise<Return>>
		) {
			const methodName = String(context.name);
			//console.log(`Decorating '${methodName}' with path '${path}'.`);
			const handler: UniversalEndpointRouteHandler = {
				path,
				implementation: async (i) => {
					if (!inputGuard(i)) throw new HTTPError(400, `Invalid input: ${JSON.stringify(i)}`);
					const impl = decoratorInstance.implementation;
					if (!impl) {
						throw new HTTPError(501, 'Not implemented');
					}
					if (methodName in impl) {
						const method = impl[methodName];
						if (typeof method === 'function') {
							return method(i);
						}
					}
					throw new HTTPError(501, 'Not implemented');
				}
			};
			decoratorInstance.handlers[path] = handler;

			// The replacement method ensures that types align with the target method.
			const replacementMethod = function (this: This, arg: Input): Promise<Return> {
				//console.log(`Calling '${methodName}'`);
				return decoratorInstance.fetchEndpoint(path, arg, outputGuard);
			};

			return replacementMethod;
		};
	}
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function stubEndpoint<I, O>(request: I): Promise<O> {
	return Promise.reject('Not implemented');
}

export type AcceptedMethods = 'GET' | 'POST' | 'PUT' | 'DELETE';

type PrimitiveTypes = 'string' | 'number' | 'boolean';

type CompositeType = { [index: string]: PrimitiveTypes };

export function hasPrimitiveProp(obj: unknown, key: string, type: PrimitiveTypes): boolean {
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
