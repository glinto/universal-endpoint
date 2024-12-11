import { decoratedEndpoint, Guard, UniversalEndpoint } from "./endpoint.js";
import { FooRequest, FooResult, isFooRequest, isFooResult } from "./base.js";

const endpoint = <I, O>(path: string, inputGuard: Guard<I>, outputGuard: Guard<O>) => 
	UniversalEndpoint.decorate(path, inputGuard, outputGuard);

export class MyLogic {

	@endpoint('/foo', isFooRequest, isFooResult)
	async foo(request: FooRequest): Promise<FooResult> {
		return decoratedEndpoint(request, isFooResult);
	}
}

