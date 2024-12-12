import { decoratedEndpoint, endpoint } from "./endpoint.js";
import { FooRequest, FooResult, isFooRequest, isFooResult } from "./base.js";

export class MyLogic {

	@endpoint('/foo', isFooRequest, isFooResult)
	async foo(request: FooRequest): Promise<FooResult> {
		return decoratedEndpoint(request, isFooResult);
	}
}

