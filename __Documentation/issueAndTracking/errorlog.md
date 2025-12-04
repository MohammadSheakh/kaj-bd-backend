1. nerob vai face this .. 

🚨 globalErrorHandler ~~  BSONError: input must be a 24 character hex string, 12 byte Uint8Array, or an integer
    at new ObjectId (/home/mohammadsheakh/s/suplifylife-back-end/node_modules/.pnpm/bson@6.10.3/node_modules/bson/src/objectid.ts:120:15)
    at DoctorPatientService.<anonymous> (/home/mohammadsheakh/s/suplifylife-back-end/src/modules/personRelationships.module/doctorPatient/doctorPatient.service.ts:212:22)
    at Generator.next (<anonymous>)
    at /home/mohammadsheakh/s/suplifylife-back-end/src/modules/personRelationships.module/doctorPatient/doctorPatient.service.ts:8:71
    at new Promise (<anonymous>)
    at __awaiter (/home/mohammadsheakh/s/suplifylife-back-end/src/modules/personRelationships.module/doctorPatient/doctorPatient.service.ts:4:12)
    at DoctorPatientService.getAllProtocolForADoctorForPatient (/home/mohammadsheakh/s/suplifylife-back-end/src/modules/personRelationships.module/doctorPatient/doctorPatient.service.ts:197:16)
    at DoctorPatientController.<anonymous> (/home/mohammadsheakh/s/suplifylife-back-end/src/modules/personRelationships.module/doctorPatient/doctorPatient.controller.ts:163:52)
    at Generator.next (<anonymous>)
    at /home/mohammadsheakh/s/suplifylife-back-end/src/modules/personRelationships.module/doctorPatient/doctorPatient.controller.ts:8:71
Tue Sep 23 2025 10:38:20 [Lock Smit] error: 172.26.89.58 - GET /api/v1/doctor-patients/protocols-for-patient?patientId=68c63c969582d6dc2d576179&doctorId=null 500 - 222.725 ms



🚨 globalErrorHandler ~~  Error: Cannot set headers after they are sent to the client
    at new NodeError (node:internal/errors:405:5)
    at ServerResponse.setHeader (node:_http_outgoing:648:11)
    at ServerResponse.header (/home/mohammadsheakh/s/kaj-bd/node_modules/.pnpm/express@4.21.2/node_modules/express/lib/response.js:794:10)
    at ServerResponse.send (/home/mohammadsheakh/s/kaj-bd/node_modules/.pnpm/express@4.21.2/node_modules/express/lib/response.js:174:12)
    at ServerResponse.json (/home/mohammadsheakh/s/kaj-bd/node_modules/.pnpm/express@4.21.2/node_modules/express/lib/response.js:278:15)
    at sendResponse (/home/mohammadsheakh/s/kaj-bd/src/shared/sendResponse.ts:19:25)
    at PaymentTransactionController.<anonymous> (/home/mohammadsheakh/s/kaj-bd/src/modules/payment.module/paymentTransaction/paymentTransaction.controller.ts:183:17)
    at Generator.next (<anonymous>)
    at fulfilled (/home/mohammadsheakh/s/kaj-bd/src/modules/payment.module/paymentTransaction/paymentTransaction.controller.ts:5:58)
    at processTicksAndRejections (node:internal/process/task_queues:95:5) {
  code: 'ERR_HTTP_HEADERS_SENT'
}