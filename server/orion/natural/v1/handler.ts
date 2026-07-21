import type { NaturalServiceHandler } from '../../../../src/generated/server/orion/natural/v1/service_server';

import { listNaturalEvents } from './list-natural-events';

export const naturalHandler: NaturalServiceHandler = {
  listNaturalEvents,
};
