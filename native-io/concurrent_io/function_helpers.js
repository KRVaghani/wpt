// The concurrency tests assert that no pair of asynchronous I/O operations is
// run concurrently. For each operation, there is one file containing the tests
// asserting that the operation makes other operations reject. In order to avoid
// constructing a quadratic number of tests, the rejecting operations are
// abstracted into an array defined here. This array can be reused for each
// operation.
//
// For any rejecting operation, define the following.
//   'name': The operations name
//   'prepare': Code needed before performing the operation, e.g.. buffer
//              allocation. May be empty.
//   'assertRejection': A promise_rejects_dom(...) statement that calls the
//                      operation.
//   'assertUnchanged': An assertion that rejecting the promise did not change
//                      the buffers in unwanted ways. May be empty.

const kOpRead = {
  'name': 'read',
  'prepare': () => {
    const readSharedArrayBuffer = new SharedArrayBuffer(4);
    const readBytes = new Uint8Array(readSharedArrayBuffer);
    return readBytes;
  },
  'assertRejection': async (testCase, file, readBytes) => {
    await promise_rejects_dom(testCase, 'InvalidStateError',
                              file.read(readBytes, 4));
  },
  'assertUnchanged': (readBytes) => {
    assert_array_equals(readBytes, [0, 0, 0, 0]);
  },
};
const kOpWrite = {
  'name': 'write',
  'prepare': () => {
    const writeSharedArrayBuffer = new SharedArrayBuffer(4);
    const writtenBytes = new Uint8Array(writeSharedArrayBuffer);
    writtenBytes.set([96, 97, 98, 99]);
    return writtenBytes;
  },
  'assertRejection': async (testCase, file, writtenBytes) => {
    await promise_rejects_dom(testCase, 'InvalidStateError',
                              file.write(writtenBytes, 4));
  },
  'assertUnchanged': () => {},
};
const kOpGetLength = {
  'name': 'getLength',
  'prepare': () => {},
  'assertRejection': async (testCase, file, readBytes) => {
    await promise_rejects_dom(testCase, 'InvalidStateError',
                              file.getLength());
  },
  'assertUnchanged': () => {},
};
const kOperations = [kOpRead, kOpWrite, kOpGetLength];


// Returns a handle to a newly created file that holds some data.
//
// The file will be closed and deleted when the test ends.
async function createFile(testCase, fileName) {
  const file = await nativeIO.open(fileName);
  testCase.add_cleanup(async () => {
    await file.close();
    await nativeIO.delete(fileName);
  });

  const writeSharedArrayBuffer = new SharedArrayBuffer(4);
  const writtenBytes = new Uint8Array(writeSharedArrayBuffer);
  writtenBytes.set([64, 65, 66, 67]);
  const writeCount = await file.write(writtenBytes, 0);
  assert_equals(writeCount, 4);

  return file;
}
