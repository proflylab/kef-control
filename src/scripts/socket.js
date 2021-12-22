import { Socket } from 'net'

let socket = {}

socket.source = {
  Wifi: Buffer.from([0x53, 0x30, 0x81, 0x12, 0x82]),
  Bluetooth: Buffer.from([0x53, 0x30, 0x81, 0x19, 0xad]),
  Aux: Buffer.from([0x53, 0x30, 0x81, 0x1a, 0x9b]),
  Opt: Buffer.from([0x53, 0x30, 0x81, 0x1b, 0x00]),
  Usb: Buffer.from([0x53, 0x30, 0x81, 0x1c, 0xf7])
}

socket.table = {
  18: socket.source.Wifi,
  25: socket.source.Bluetooth,
  26: socket.source.Aux,
  27: socket.source.Opt,
  28: socket.source.Usb,
  31: socket.source.Bluetooth
}

socket.msg = {
  getSource: Buffer.from([0x47, 0x30, 0x80, 0xd9]),
  getVolume: Buffer.from([0x47, 0x25, 0x80, 0x6c]),
  turnOff: Buffer.from([0x53, 0x30, 0x81, 0x9b, 0x0b])
}

socket.verify = (buffer, bytes) => buffer.includes(Buffer.from(bytes))

socket.client = new Socket()

export default socket
