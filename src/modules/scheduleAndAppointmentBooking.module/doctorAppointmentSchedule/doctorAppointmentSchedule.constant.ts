export enum TDoctorAppointmentScheduleStatus {
  available = 'available',
  booked = 'booked',
  cancelled = 'cancelled',  
  expired = 'expired', // TODO : THINK : after when it should be expired ..  
}

export enum TMeetingLink {
  zoom = 'zoom',
  googleMeet = 'googleMeet',
  others = 'others',
}