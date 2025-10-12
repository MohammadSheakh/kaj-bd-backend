- [ ] We need to provide option to patient to pospond a appointment .. - sheakh 

###### doctorPatientScheduleBooking.service.ts
#### createV2
/******
* 📝
* First We have to check user's subscriptionPlan
* 1. if "none".. we dont let him to book appointment
* 2. if "freeTrial" .. need to pay // TODO : need to talk with client about this feature
* 3. if "standard" or "standardPlus" .. they need to pay to book appointment
* 4. if "vise" ... no payment required to book appointment
* ******* */

/********
* 📝
* here we also check if relation ship between doctor and patient exist or not
*  if not then we create the relationship 
*/
        
/******
* 📝
* check appointment schedule 
* if scheduleStatus[available]
* if scheduleDate >= today
* if timeLeft > 0 // so, we dont think about startTime .. //TODO :
* ++++++ create doctorPatientScheduleBooking
* 
* **** */

/*********
* 📝
* 3  ++++++ First Make DoctorAppointmentSchedule [scheduleStatus.booked] after payment done .. we add  [booked_by = patientId]
* 4. ++++++ We Create DoctorPatientScheduleBooking [status.pending] [PaymentStatus.unpaid] [PaymentTransactionId = null]
* 5. ++ we Provide Stripe URL to payment .. 
* -----------------------------------------------------------
* 6. If Payment Successful .. its going to WEBHOOK 
* 7. ++++ We create Payment Transaction .. 
* 7. ++++ We update DoctorPatientScheduleBooking [status.scheduled] [PaymentStatus.paid] [PaymentTransactionId = <transaction_id>]
* 8. ++++ We update DoctorAppointmentSchedule [booked_by = patientId]
* 
* 9. If Payment Failed .. its going to WEBHOOK
* 10. ++++ We update DoctorPatientScheduleBooking [status.cancelled] [PaymentStatus.failed] [PaymentTransactionId = null] 
* 11. ++++ We update DoctorAppointmentSchedule [scheduleStatus.available] [booked_by = null]
* 
* ******* */


/*****
* 📝
* we receive these data in webhook ..
* based on this data .. we have to update our database in webhook ..
* also give user a response ..
* 
* now as our system has multiple feature that related to payment 
* so we provide all related data as object and stringify that ..
* also provide .. for which category these information we passing ..
* 
* like we have multiple usecase like
* 1. Product Order,
* 2. Lab Booking,
* 3. Doctor Appointment 
* 4. Specialist Workout Class Booking,
* 5. Training Program Buying .. 
*  
* **** */


/******
* 📝
* With this information .. in webhook first we create a 
* PaymentTransaction ..  where paymentStatus[Complete]
*  +++++++++++++++++++++ transactionId :: coming from Stripe
* ++++++++++++++++++++++ paymentIntent :: coming from stripe .. or we generate this 
* ++++++++++++++++++++++ gatewayResponse :: whatever coming from stripe .. we save those for further log
* 
* We also UPDATE Booking Infomation .. 
* 
* 7. ++++ We update DoctorPatientScheduleBooking [status.scheduled] [PaymentStatus.paid] [PaymentTransactionId = <transaction_id>]
* 8. ++++ We update DoctorAppointmentSchedule [booked_by = patientId]
* 
* ******* */