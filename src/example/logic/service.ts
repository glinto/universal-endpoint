import { stubEndpoint, UniversalEndpoint } from '../../index.js';
import { FooRequest, FooResult, isFooRequest, isFooResult, Logic } from './base.js';

export const { universalEndpoint, endpoint } = UniversalEndpoint.create();

universalEndpoint.baseUrl = 'http://localhost:8080';

export class ClientLogic implements Logic {
	@endpoint('/foo', isFooRequest, isFooResult)
	async foo(request: FooRequest): Promise<FooResult> {
		return stubEndpoint(request);
	}
}
