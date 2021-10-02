
// Would be great to have Promise.defer :_(
export class Deferred {
  resolve = null
  reject = null
  constructor() {
    this.promise = new Promise((resolve, reject) => {
      this.resolve = resolve
      this.reject = reject
    })
  }
}

export function createRequester(sender) {
  const requester = {
      incoming: null,
      greeting(data) {
          // new incoming message on the way
          const incoming = requester.incoming = new Deferred()
          sender(data)
          return incoming.promise
      }
  }
  
  return requester
}