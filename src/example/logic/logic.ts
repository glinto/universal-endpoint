import { arrayGuard, endpointStub, HTTPRequest, numberGuard, stringGuard, UniversalEndpoint } from '../../index.js';
import { FooRequest, FooResult, isFooRequest, isFooResult } from './entities.js';

export const { endpointInstance, endpoint } = UniversalEndpoint.create();

export abstract class Logic {
	@endpoint('POST', '/foo/:age', isFooRequest, isFooResult)
	async foo(request: HTTPRequest<FooRequest>): Promise<FooResult> {
		return endpointStub(request);
	}

	@endpoint('GET', '/number/:n', numberGuard, stringGuard)
	async primitiveNumber(request: HTTPRequest<number>): Promise<string> {
		return endpointStub(request);
	}

	@endpoint('POST', '/max/:num/:num', arrayGuard(numberGuard), numberGuard)
	async max(nums: HTTPRequest<number[]>): Promise<number> {
		return endpointStub(nums);
	}

	@endpoint('GET', '/bar', undefined, stringGuard)
	async bar(v: HTTPRequest<void>): Promise<string> {
		return endpointStub(v);
	}
}

export class ClientLogic extends Logic {}
