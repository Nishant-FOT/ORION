export const config = { runtime: 'edge' };

import { createDomainGateway, serverOptions } from '../../../server/gateway';
import { createNaturalServiceRoutes } from '../../../src/generated/server/orion/natural/v1/service_server';
import { naturalHandler } from '../../../server/orion/natural/v1/handler';

export default createDomainGateway(
  createNaturalServiceRoutes(naturalHandler, serverOptions),
);
