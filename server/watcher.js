import fs from "fs";
import { createClient } from "redis";

const publishClient = createClient();
publishClient.connect();

const target_file = "./text-changes.log";

class Watch {
  constructor() {
    if (!Watch.instance) {
      this.previousFileSize = 0;
      this.lastReadByte = 0;
      this.lastTenLines = [];
      Watch.instance = this;
    }

    return Watch.instance;
  }

  #watchFile() {
    fs.watchFile(target_file, (curr, prev) => {
      if (target_file) {
        if (curr.size.valueOf() === this.previousFileSize.valueOf()) {
          return;
        }

        let buffer = Buffer.alloc(curr.size - this.lastReadByte);

        this.previousFileSize = curr.size;

        fs.open(target_file, "r", (err, fd) => {
          if (err) {
            return console.error(err);
          }

          console.log("Reading the file...........");

          fs.read(fd, buffer, 0, buffer.length, this.lastReadByte, (err, bytes) => {
            if (err) {
              return console.error(err);
            }

            if (bytes > 0) {
              const dataString = buffer.subarray(0, bytes).toString();
              const dataArray = dataString.split("\n");

              dataArray.forEach((elem) => {
                this.lastTenLines.push(elem);
              });

              this.lastTenLines = this.lastTenLines.slice(-10);

              publishClient.publish(
                "room1",
                JSON.stringify({
                  type: "MESSAGE_FROM_WATCHER",
                  message: dataArray,
                })
              );
            }

            this.lastReadByte = curr.size + 1;

            fs.close(fd, (err) => {
              if (err) {
                return console.error(err);
              }

              console.log("File closed");
            });
          });
        });
      }
    });
  }

  main() {
    let buffer = Buffer.alloc(1024000);

    fs.open(target_file, "r", (err, fd) => {
      if (err) {
        return console.error(err);
      }

      console.log("Reading the file...........");

      fs.read(fd, buffer, 0, buffer.length, this.lastReadByte, (err, bytes) => {
        if (err) {
          return console.error(err);
        }

        if (bytes > 0) {
          const dataString = buffer.subarray(0, bytes).toString();
          const dataArray = dataString.split("\n");
          const reqDataArray = dataArray.splice(-10);
          reqDataArray.forEach((data) => {
            this.lastTenLines.push(data);
          });
        }

        this.previousFileSize = bytes;
        this.lastReadByte = bytes + 1;

        fs.close(fd, (err) => {
          if (err) {
            return console.error(err);
          }

          console.log("File closed");
        });
      });
    });

    this.#watchFile();
  }

  getLastLines() {
    return JSON.stringify({
      message: this.lastTenLines,
    });
  }
}

const watcherInstance = new Watch();
export default watcherInstance;
