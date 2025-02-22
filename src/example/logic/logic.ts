import { stubEndpoint, UniversalEndpoint } from '../../index.js';
import { FooRequest, FooResult, isFooRequest, isFooResult } from './entities.js';

export const { endpointInstance, endpoint } = UniversalEndpoint.create();

export abstract class Logic {
	@endpoint('/foo', isFooRequest, isFooResult)
	async foo(request: FooRequest): Promise<FooResult> {
		return stubEndpoint(request);
	}
}

export class ClientLogic extends Logic {}
