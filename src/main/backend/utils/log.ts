export class Logging {
  constructor(private label: string) {}
  log(msg: string) {
    console.log(`[    ${this.label.padStart(15)} ] ${msg}`);
  }
  eventStart(msg: string) {
    console.log(`[ >  ${this.label.padStart(15)} ] ${msg}`);
  }
  eventEnd(msg: string) {
    console.log(`[ #  ${this.label.padStart(15)} ] ${msg}`);
  }
  eventError(msg: string) {
    console.log(`[ !  ${`${this.label}`.padStart(15)} ] ${msg}`);
  }
}

export const log = new Logging("Status");
