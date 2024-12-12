export type Guard<T> = (value: unknown) => value is T;

export class UniversalEndpoint {
	
	static baseUrl = 'http://localhost';

	static async fetchEndpoint<I, O>(path: string, request: I, outputGuard: Guard<O>): Promise<O> {
		const response = await fetch(new URL(path, this.baseUrl), {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(request)
		});
		if (!response.ok) {
			throw new Error(`HTTP error ${response.status}`);
		}
		const result = await response.json();
		if (!outputGuard(result)) {
			throw new Error(`Invalid response from server: result`);
		}
		return result;
	}

	static decorate<This, Input, Return>(path: string, inputGuard: Guard<Input>, outputGuard: Guard<Return>) {
        return function loggedMethod(
            target: (this: This, arg: Input) => Promise<Return>,
            context: ClassMethodDecoratorContext<This, (this: This, arg: Input) => Promise<Return>>
        ) {
            const methodName = String(context.name);
            console.log(`Decorating '${methodName}' with path '${path}'.`);

            // The replacement method ensures that types align with the target method.
            const replacementMethod = function (this: This, arg: Input): Promise<Return> {
                console.log(`Calling '${methodName}'`);
                return UniversalEndpoint.fetchEndpoint(path, arg, outputGuard);
            };

            return replacementMethod;
        };
	}
}

export function decoratedEndpoint<I, O>(request: I, outputGuard: Guard<O>): Promise<O> {
	return Promise.reject('Not implemented');
}

export type AcceptedMethods = 'GET' | 'POST' | 'PUT' | 'DELETE';

export const endpoint = <I, O>(path: string, inputGuard: Guard<I>, outputGuard: Guard<O>) => 
	UniversalEndpoint.decorate(path, inputGuard, outputGuard);
