/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/ban-ts-comment */

import PdClient from "node-pagerduty";
import * as os from "os";
import { logger } from "./logging";

export class Pager {
  static async sendEvent(
    severity: string,
    summary: string,
    customDetails: any = {}
  ): Promise<void> {
    let routingKey = process.env.PAGERDUTY_EVENT_KEY ?? "";
    if (routingKey.length == 0) {
      return;
    }
    let pdClient = new PdClient(routingKey);
    Object.assign(customDetails, {
      source: os.hostname(),
      group: process.env.CLUSTER ?? "",
      client: os.hostname(),
    });
    let payload = {
      payload: {
        summary: summary,
        timestamp: new Date().toISOString(),
        source: os.hostname(),
        severity: severity,
        group: process.env.CLUSTER ?? "",
        custom_details: customDetails,
      },
      routing_key: routingKey,
      event_action: "trigger",
      client: os.hostname(),
    };
    logger.info("Event sending to pagerduty:", payload);
    await pdClient.events.sendEvent(payload);
  }
}
