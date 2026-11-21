import { Attendance, Department, Branch } from '@/types/attendance';

export const DEPARTMENTS: Department[] = [
  'BM',
  'ABM',
];

export const BRANCHES: Branch[] = [
  "Bannerghatta",
  "Basaveshwara Nagar",
  "Basaveshwara Nagar 2",
  "Bommanahalli",
  "Fraser Town",
  "Gandhi Bazar",
  "Ganganagar (CBI)",
  "Hosa road",
  "Hoskote",
  "Hongasandra",
  "Indiranagar",
  "J P Nagar",
  "Jakkur",
  "Jayanagar",
  "Kathriguppe",
  "Kengeri",
  "K R Puram",
  "K R Puram - 2",
  "Kadugudi",
  "Kodagehalli",
  "Koramangala",
  "Kothanur",
  "Lingarajapuram",
  "Mahalakshmi layout",
  "Marathalli",
  "Malleshwaram",
  "Nelmangala",
  "Nagarabhavi",
  "Peenya-Jallahalli",
  "Peenya-Jalahalli - 2",
  "Peenya-Hegnahalli",
  "Queens Road",
  "Rajajinagar",
  "Ramamurthy Nagar",
  "Sevanagar",
  "Sunkadakatte",
  "Sunkadakatte 2",
  "Sarjapur",
  "Thanisandra",
  "Tin Factory",
  "Uttarahalli",
  "Vidyaranyapura",
  "Vijayanagar",
  "Vignan Nagar",
  "Varthur",
  "Whitefield",
  "Whitefield - 2",
  "Yelahanka",
  "Yeshwanthpur",
  "Yeshwanthpur 2",
  "Ulsoor",
  "8th Mile",
  "Malleshwarm - 2",
  "Madiwala"
];

export interface BranchInfo {
  name: string;
  status: 'Active' | 'Closed' | 'Permanent Closed';
}

export const BANGALORE_BRANCH_DETAILS: BranchInfo[] = [
  {
    "name": "Bannerghatta",
    "status": "Active"
  },
  {
    "name": "Basaveshwara Nagar",
    "status": "Active"
  },
  {
    "name": "Basaveshwara Nagar 2",
    "status": "Active"
  },
  {
    "name": "Bommanahalli",
    "status": "Active"
  },
  {
    "name": "Fraser Town",
    "status": "Active"
  },
  {
    "name": "Gandhi Bazar",
    "status": "Active"
  },
  {
    "name": "Ganganagar (CBI)",
    "status": "Active"
  },
  {
    "name": "Hosa road",
    "status": "Active"
  },
  {
    "name": "Hoskote",
    "status": "Active"
  },
  {
    "name": "Hongasandra",
    "status": "Active"
  },
  {
    "name": "Indiranagar",
    "status": "Active"
  },
  {
    "name": "J P Nagar",
    "status": "Active"
  },
  {
    "name": "Jakkur",
    "status": "Active"
  },
  {
    "name": "Jayanagar",
    "status": "Active"
  },
  {
    "name": "Kathriguppe",
    "status": "Active"
  },
  {
    "name": "Kengeri",
    "status": "Active"
  },
  {
    "name": "K R Puram",
    "status": "Active"
  },
  {
    "name": "K R Puram - 2",
    "status": "Closed"
  },
  {
    "name": "Kadugudi",
    "status": "Closed"
  },
  {
    "name": "Kodagehalli",
    "status": "Active"
  },
  {
    "name": "Koramangala",
    "status": "Active"
  },
  {
    "name": "Kothanur",
    "status": "Active"
  },
  {
    "name": "Lingarajapuram",
    "status": "Active"
  },
  {
    "name": "Mahalakshmi layout",
    "status": "Active"
  },
  {
    "name": "Marathalli",
    "status": "Active"
  },
  {
    "name": "Malleshwaram",
    "status": "Active"
  },
  {
    "name": "Nelmangala",
    "status": "Active"
  },
  {
    "name": "Nagarabhavi",
    "status": "Active"
  },
  {
    "name": "Peenya-Jallahalli",
    "status": "Active"
  },
  {
    "name": "Peenya-Jalahalli - 2",
    "status": "Active"
  },
  {
    "name": "Peenya-Hegnahalli",
    "status": "Closed"
  },
  {
    "name": "Queens Road",
    "status": "Active"
  },
  {
    "name": "Rajajinagar",
    "status": "Active"
  },
  {
    "name": "Ramamurthy Nagar",
    "status": "Active"
  },
  {
    "name": "Sevanagar",
    "status": "Active"
  },
  {
    "name": "Sunkadakatte",
    "status": "Active"
  },
  {
    "name": "Sunkadakatte 2",
    "status": "Active"
  },
  {
    "name": "Sarjapur",
    "status": "Active"
  },
  {
    "name": "Thanisandra",
    "status": "Active"
  },
  {
    "name": "Tin Factory",
    "status": "Active"
  },
  {
    "name": "Uttarahalli",
    "status": "Active"
  },
  {
    "name": "Vidyaranyapura",
    "status": "Active"
  },
  {
    "name": "Vijayanagar",
    "status": "Active"
  },
  {
    "name": "Vignan Nagar",
    "status": "Active"
  },
  {
    "name": "Varthur",
    "status": "Closed"
  },
  {
    "name": "Whitefield",
    "status": "Active"
  },
  {
    "name": "Whitefield - 2",
    "status": "Closed"
  },
  {
    "name": "Yelahanka",
    "status": "Active"
  },
  {
    "name": "Yeshwanthpur",
    "status": "Active"
  },
  {
    "name": "Yeshwanthpur 2",
    "status": "Active"
  },
  {
    "name": "Ulsoor",
    "status": "Active"
  },
  {
    "name": "8th Mile",
    "status": "Active"
  },
  {
    "name": "Malleshwarm - 2",
    "status": "Permanent Closed"
  },
  {
    "name": "Madiwala",
    "status": "Active"
  }
];

export interface StaffMovement {
  name: string;
  phone: string;
  from: string;
  to: string;
  date: string;
}

export const STAFF_MOVEMENTS: StaffMovement[] = [
  {
    "name": "Sikindar",
    "phone": "9901502503",
    "from": "Basaveshwara Nagar",
    "to": "Basaveshwara Nagar",
    "date": "2026-11-16"
  },
  {
    "name": "Suryakanth",
    "phone": "9353066832",
    "from": "Koramangala",
    "to": "Whitefield",
    "date": "2026-11-16"
  },
  {
    "name": "Sunil",
    "phone": "8073203729",
    "from": "Kengeri",
    "to": "R R Nagar",
    "date": "2026-11-16"
  },
  {
    "name": "Ramachandra",
    "phone": "8088244326",
    "from": "Jalahalli",
    "to": "Hegganahalli",
    "date": "2026-11-16"
  },
  {
    "name": "Punith",
    "phone": "9538380402",
    "from": "Hoskerehalli",
    "to": "J P Nagar",
    "date": "2026-11-16"
  },
  {
    "name": "James",
    "phone": "9066551828",
    "from": "Marathahalli",
    "to": "Varthur",
    "date": "2026-11-16"
  }
];

const NOV_20_DATA: Attendance[] = [
  {
    "id": "att-bg-1001",
    "employeeId": "EMP-1001",
    "name": "Meghana",
    "employeeName": "Meghana",
    "email": "meghana@atticagold.com",
    "department": "BM",
    "role": "Branch Manager",
    "branch": "Bannerghatta",
    "date": "2026-11-20",
    "checkIn": "09:30",
    "checkOut": "18:30",
    "status": "Present",
    "notes": "On-Duty regular hours",
    "createdAt": "2026-11-20T04:00:00.000Z"
  },
  {
    "id": "att-bg-1002",
    "employeeId": "EMP-1002",
    "name": "Bhavya",
    "employeeName": "Bhavya",
    "email": "bhavya@atticagold.com",
    "department": "BM",
    "role": "Branch Manager",
    "branch": "Basaveshwara Nagar",
    "date": "2026-11-20",
    "checkIn": "09:30",
    "checkOut": "18:30",
    "status": "Present",
    "notes": "On-Duty regular hours",
    "createdAt": "2026-11-20T04:00:00.000Z"
  },
  {
    "id": "att-bg-1003",
    "employeeId": "EMP-1003",
    "name": "Harini",
    "employeeName": "Harini",
    "email": "harini@atticagold.com",
    "department": "BM",
    "role": "Branch Manager",
    "branch": "Basaveshwara Nagar 2",
    "date": "2026-11-20",
    "checkIn": "09:30",
    "checkOut": "18:30",
    "status": "Present",
    "notes": "On-Duty regular hours",
    "createdAt": "2026-11-20T04:00:00.000Z"
  },
  {
    "id": "att-bg-1004",
    "employeeId": "EMP-1004",
    "name": "pooja",
    "employeeName": "pooja",
    "email": "pooja@atticagold.com",
    "department": "BM",
    "role": "Branch Manager",
    "branch": "Bommanahalli",
    "date": "2026-11-20",
    "checkIn": "09:30",
    "checkOut": "18:30",
    "status": "Present",
    "notes": "On-Duty regular hours",
    "createdAt": "2026-11-20T04:00:00.000Z"
  },
  {
    "id": "att-bg-1005",
    "employeeId": "EMP-1005",
    "name": "Aishwarya R",
    "employeeName": "Aishwarya R",
    "email": "aishwaryar@atticagold.com",
    "department": "ABM",
    "role": "Assistant Branch Manager",
    "branch": "Fraser Town",
    "date": "2026-11-20",
    "checkIn": "09:45",
    "checkOut": "18:30",
    "status": "Present",
    "notes": "On-Duty regular hours",
    "createdAt": "2026-11-20T04:15:00.000Z"
  },
  {
    "id": "att-bg-1006",
    "employeeId": "EMP-1006",
    "name": "Silambarasan",
    "employeeName": "Silambarasan",
    "email": "silambarasan@atticagold.com",
    "department": "BM",
    "role": "Branch Manager",
    "branch": "Gandhi Bazar",
    "date": "2026-11-20",
    "checkIn": "09:30",
    "checkOut": "18:30",
    "status": "Present",
    "notes": "On-Duty regular hours",
    "createdAt": "2026-11-20T04:00:00.000Z"
  },
  {
    "id": "att-bg-1007",
    "employeeId": "EMP-1007",
    "name": "Kushala Kumari",
    "employeeName": "Kushala Kumari",
    "email": "kushalakumari@atticagold.com",
    "department": "BM",
    "role": "Branch Manager",
    "branch": "Ganganagar (CBI)",
    "date": "2026-11-20",
    "checkIn": "09:30",
    "checkOut": "18:30",
    "status": "Present",
    "notes": "On-Duty regular hours",
    "createdAt": "2026-11-20T04:00:00.000Z"
  },
  {
    "id": "att-bg-1008",
    "employeeId": "EMP-1008",
    "name": "Sushmitha",
    "employeeName": "Sushmitha",
    "email": "sushmitha@atticagold.com",
    "department": "BM",
    "role": "Branch Manager",
    "branch": "Hosa road",
    "date": "2026-11-20",
    "checkIn": "09:30",
    "checkOut": "18:30",
    "status": "Present",
    "notes": "On-Duty regular hours",
    "createdAt": "2026-11-20T04:00:00.000Z"
  },
  {
    "id": "att-bg-1009",
    "employeeId": "EMP-1009",
    "name": "Kavya",
    "employeeName": "Kavya",
    "email": "kavya@atticagold.com",
    "department": "BM",
    "role": "Branch Manager",
    "branch": "Hoskote",
    "date": "2026-11-20",
    "checkIn": "09:30",
    "checkOut": "18:30",
    "status": "Present",
    "notes": "On-Duty regular hours",
    "createdAt": "2026-11-20T04:00:00.000Z"
  },
  {
    "id": "att-bg-1010",
    "employeeId": "EMP-1010",
    "name": "Poornima",
    "employeeName": "Poornima",
    "email": "poornima@atticagold.com",
    "department": "BM",
    "role": "Branch Manager",
    "branch": "Hongasandra",
    "date": "2026-11-20",
    "checkIn": "09:30",
    "checkOut": "18:30",
    "status": "Present",
    "notes": "On-Duty regular hours",
    "createdAt": "2026-11-20T04:00:00.000Z"
  },
  {
    "id": "att-bg-1011",
    "employeeId": "EMP-1011",
    "name": "Dhanush kumar",
    "employeeName": "Dhanush kumar",
    "email": "dhanushkumar@atticagold.com",
    "department": "BM",
    "role": "Branch Manager",
    "branch": "Indiranagar",
    "date": "2026-11-20",
    "checkIn": "09:30",
    "checkOut": "18:30",
    "status": "Present",
    "notes": "On-Duty regular hours",
    "createdAt": "2026-11-20T04:00:00.000Z"
  },
  {
    "id": "att-bg-1012",
    "employeeId": "EMP-1012",
    "name": "Divyashree",
    "employeeName": "Divyashree",
    "email": "divyashree@atticagold.com",
    "department": "BM",
    "role": "Branch Manager",
    "branch": "J P Nagar",
    "date": "2026-11-20",
    "checkIn": "09:30",
    "checkOut": "18:30",
    "status": "Present",
    "notes": "On-Duty regular hours",
    "createdAt": "2026-11-20T04:00:00.000Z"
  },
  {
    "id": "att-bg-1013",
    "employeeId": "EMP-1013",
    "name": "Sindhu C",
    "employeeName": "Sindhu C",
    "email": "sindhuc@atticagold.com",
    "department": "BM",
    "role": "Branch Manager",
    "branch": "Jakkur",
    "date": "2026-11-20",
    "checkIn": "09:30",
    "checkOut": "18:30",
    "status": "Present",
    "notes": "On-Duty regular hours",
    "createdAt": "2026-11-20T04:00:00.000Z"
  },
  {
    "id": "att-bg-1014",
    "employeeId": "EMP-1014",
    "name": "gowri",
    "employeeName": "gowri",
    "email": "gowri@atticagold.com",
    "department": "BM",
    "role": "Branch Manager",
    "branch": "Jayanagar",
    "date": "2026-11-20",
    "checkIn": "09:30",
    "checkOut": "18:30",
    "status": "Present",
    "notes": "On-Duty regular hours",
    "createdAt": "2026-11-20T04:00:00.000Z"
  },
  {
    "id": "att-bg-1015",
    "employeeId": "EMP-1015",
    "name": "Lakshmi M",
    "employeeName": "Lakshmi M",
    "email": "lakshmim@atticagold.com",
    "department": "ABM",
    "role": "Assistant Branch Manager",
    "branch": "Jayanagar",
    "date": "2026-11-20",
    "checkIn": "09:45",
    "checkOut": "18:30",
    "status": "Present",
    "notes": "On-Duty regular hours",
    "createdAt": "2026-11-20T04:15:00.000Z"
  },
  {
    "id": "att-bg-1016",
    "employeeId": "EMP-1016",
    "name": "Mohan",
    "employeeName": "Mohan",
    "email": "mohan@atticagold.com",
    "department": "BM",
    "role": "Branch Manager",
    "branch": "Kathriguppe",
    "date": "2026-11-20",
    "checkIn": "09:30",
    "checkOut": "18:30",
    "status": "Present",
    "notes": "On-Duty regular hours",
    "createdAt": "2026-11-20T04:00:00.000Z"
  },
  {
    "id": "att-bg-1017",
    "employeeId": "EMP-1017",
    "name": "Mokshith",
    "employeeName": "Mokshith",
    "email": "mokshith@atticagold.com",
    "department": "BM",
    "role": "Branch Manager",
    "branch": "Kengeri",
    "date": "2026-11-20",
    "checkIn": "09:30",
    "checkOut": "18:30",
    "status": "Present",
    "notes": "On-Duty regular hours",
    "createdAt": "2026-11-20T04:00:00.000Z"
  },
  {
    "id": "att-bg-1018",
    "employeeId": "EMP-1018",
    "name": "mathura",
    "employeeName": "mathura",
    "email": "mathura@atticagold.com",
    "department": "BM",
    "role": "Branch Manager",
    "branch": "K R Puram",
    "date": "2026-11-20",
    "checkIn": "09:30",
    "checkOut": "18:30",
    "status": "Present",
    "notes": "On-Duty regular hours",
    "createdAt": "2026-11-20T04:00:00.000Z"
  },
  {
    "id": "att-bg-1019",
    "employeeId": "EMP-1019",
    "name": "Triveni S",
    "employeeName": "Triveni S",
    "email": "trivenis@atticagold.com",
    "department": "ABM",
    "role": "Assistant Branch Manager",
    "branch": "K R Puram",
    "date": "2026-11-20",
    "checkIn": "09:45",
    "checkOut": "18:30",
    "status": "Present",
    "notes": "On-Duty regular hours",
    "createdAt": "2026-11-20T04:15:00.000Z"
  },
  {
    "id": "att-bg-1020",
    "employeeId": "EMP-1020",
    "name": "Sikindar",
    "employeeName": "Sikindar",
    "email": "sikindar@atticagold.com",
    "department": "BM",
    "role": "Branch Manager",
    "branch": "Kodagehalli",
    "date": "2026-11-20",
    "checkIn": "09:30",
    "checkOut": "18:30",
    "status": "Present",
    "notes": "Movement: Basaveshwara Nagar -> Basaveshwara Nagar (9901502503)",
    "createdAt": "2026-11-20T04:00:00.000Z"
  },
  {
    "id": "att-bg-1021",
    "employeeId": "EMP-1021",
    "name": "Akshatha",
    "employeeName": "Akshatha",
    "email": "akshatha@atticagold.com",
    "department": "BM",
    "role": "Branch Manager",
    "branch": "Koramangala",
    "date": "2026-11-20",
    "checkIn": "09:30",
    "checkOut": "18:30",
    "status": "Present",
    "notes": "On-Duty regular hours",
    "createdAt": "2026-11-20T04:00:00.000Z"
  },
  {
    "id": "att-bg-1022",
    "employeeId": "EMP-1022",
    "name": "Prashanth",
    "employeeName": "Prashanth",
    "email": "prashanth@atticagold.com",
    "department": "BM",
    "role": "Branch Manager",
    "branch": "Kothanur",
    "date": "2026-11-20",
    "checkIn": "09:30",
    "checkOut": "18:30",
    "status": "Present",
    "notes": "On-Duty regular hours",
    "createdAt": "2026-11-20T04:00:00.000Z"
  },
  {
    "id": "att-bg-1023",
    "employeeId": "EMP-1023",
    "name": "Priya D",
    "employeeName": "Priya D",
    "email": "priyad@atticagold.com",
    "department": "BM",
    "role": "Branch Manager",
    "branch": "Lingarajapuram",
    "date": "2026-11-20",
    "checkIn": "09:30",
    "checkOut": "18:30",
    "status": "Present",
    "notes": "On-Duty regular hours",
    "createdAt": "2026-11-20T04:00:00.000Z"
  },
  {
    "id": "att-bg-1024",
    "employeeId": "EMP-1024",
    "name": "Preethi",
    "employeeName": "Preethi",
    "email": "preethi@atticagold.com",
    "department": "ABM",
    "role": "Assistant Branch Manager",
    "branch": "Mahalakshmi layout",
    "date": "2026-11-20",
    "checkIn": "09:45",
    "checkOut": "18:30",
    "status": "Present",
    "notes": "On-Duty regular hours",
    "createdAt": "2026-11-20T04:15:00.000Z"
  },
  {
    "id": "att-bg-1025",
    "employeeId": "EMP-1025",
    "name": "Vanishree",
    "employeeName": "Vanishree",
    "email": "vanishree@atticagold.com",
    "department": "BM",
    "role": "Branch Manager",
    "branch": "Marathalli",
    "date": "2026-11-20",
    "checkIn": "09:30",
    "checkOut": "18:30",
    "status": "Present",
    "notes": "On-Duty regular hours",
    "createdAt": "2026-11-20T04:00:00.000Z"
  },
  {
    "id": "att-bg-1026",
    "employeeId": "EMP-1026",
    "name": "Pavithra P",
    "employeeName": "Pavithra P",
    "email": "pavithrap@atticagold.com",
    "department": "BM",
    "role": "Branch Manager",
    "branch": "Malleshwaram",
    "date": "2026-11-20",
    "checkIn": "09:30",
    "checkOut": "18:30",
    "status": "Present",
    "notes": "On-Duty regular hours",
    "createdAt": "2026-11-20T04:00:00.000Z"
  },
  {
    "id": "att-bg-1027",
    "employeeId": "EMP-1027",
    "name": "poojasree k s",
    "employeeName": "poojasree k s",
    "email": "poojasreeks@atticagold.com",
    "department": "ABM",
    "role": "Assistant Branch Manager",
    "branch": "Malleshwaram",
    "date": "2026-11-20",
    "checkIn": "09:45",
    "checkOut": "18:30",
    "status": "Present",
    "notes": "On-Duty regular hours",
    "createdAt": "2026-11-20T04:15:00.000Z"
  },
  {
    "id": "att-bg-1028",
    "employeeId": "EMP-1028",
    "name": "Bhavya",
    "employeeName": "Bhavya",
    "email": "bhavya@atticagold.com",
    "department": "BM",
    "role": "Branch Manager",
    "branch": "Nelmangala",
    "date": "2026-11-20",
    "checkIn": "09:30",
    "checkOut": "18:30",
    "status": "Present",
    "notes": "On-Duty regular hours",
    "createdAt": "2026-11-20T04:00:00.000Z"
  },
  {
    "id": "att-bg-1029",
    "employeeId": "EMP-1029",
    "name": "Yuvaraj",
    "employeeName": "Yuvaraj",
    "email": "yuvaraj@atticagold.com",
    "department": "BM",
    "role": "Branch Manager",
    "branch": "Nagarabhavi",
    "date": "2026-11-20",
    "checkIn": "09:30",
    "checkOut": "18:30",
    "status": "Present",
    "notes": "On-Duty regular hours",
    "createdAt": "2026-11-20T04:00:00.000Z"
  },
  {
    "id": "att-bg-1030",
    "employeeId": "EMP-1030",
    "name": "Ravi kumar H",
    "employeeName": "Ravi kumar H",
    "email": "ravikumarh@atticagold.com",
    "department": "BM",
    "role": "Branch Manager",
    "branch": "Peenya-Jallahalli",
    "date": "2026-11-20",
    "checkIn": "09:30",
    "checkOut": "18:30",
    "status": "Present",
    "notes": "On-Duty regular hours",
    "createdAt": "2026-11-20T04:00:00.000Z"
  },
  {
    "id": "att-bg-1031",
    "employeeId": "EMP-1031",
    "name": "Preethi",
    "employeeName": "Preethi",
    "email": "preethi@atticagold.com",
    "department": "BM",
    "role": "Branch Manager",
    "branch": "Peenya-Jalahalli - 2",
    "date": "2026-11-20",
    "checkIn": "09:30",
    "checkOut": "18:30",
    "status": "Present",
    "notes": "On-Duty regular hours",
    "createdAt": "2026-11-20T04:00:00.000Z"
  },
  {
    "id": "att-bg-1032",
    "employeeId": "EMP-1032",
    "name": "Bharath",
    "employeeName": "Bharath",
    "email": "bharath@atticagold.com",
    "department": "BM",
    "role": "Branch Manager",
    "branch": "Queens Road",
    "date": "2026-11-20",
    "checkIn": "09:30",
    "checkOut": "18:30",
    "status": "Present",
    "notes": "On-Duty regular hours",
    "createdAt": "2026-11-20T04:00:00.000Z"
  },
  {
    "id": "att-bg-1033",
    "employeeId": "EMP-1033",
    "name": "Balaji B",
    "employeeName": "Balaji B",
    "email": "balajib@atticagold.com",
    "department": "ABM",
    "role": "Assistant Branch Manager",
    "branch": "Queens Road",
    "date": "2026-11-20",
    "checkIn": "09:45",
    "checkOut": "18:30",
    "status": "Present",
    "notes": "On-Duty regular hours",
    "createdAt": "2026-11-20T04:15:00.000Z"
  },
  {
    "id": "att-bg-1034",
    "employeeId": "EMP-1034",
    "name": "Kumar S L",
    "employeeName": "Kumar S L",
    "email": "kumarsl@atticagold.com",
    "department": "BM",
    "role": "Branch Manager",
    "branch": "Rajajinagar",
    "date": "2026-11-20",
    "checkIn": "09:30",
    "checkOut": "18:30",
    "status": "Present",
    "notes": "On-Duty regular hours",
    "createdAt": "2026-11-20T04:00:00.000Z"
  },
  {
    "id": "att-bg-1035",
    "employeeId": "EMP-1035",
    "name": "Arun veigas",
    "employeeName": "Arun veigas",
    "email": "arunveigas@atticagold.com",
    "department": "ABM",
    "role": "Assistant Branch Manager",
    "branch": "Rajajinagar",
    "date": "2026-11-20",
    "checkIn": "09:45",
    "checkOut": "18:30",
    "status": "Present",
    "notes": "On-Duty regular hours",
    "createdAt": "2026-11-20T04:15:00.000Z"
  },
  {
    "id": "att-bg-1036",
    "employeeId": "EMP-1036",
    "name": "Sanjana",
    "employeeName": "Sanjana",
    "email": "sanjana@atticagold.com",
    "department": "BM",
    "role": "Branch Manager",
    "branch": "Ramamurthy Nagar",
    "date": "2026-11-20",
    "checkIn": "09:30",
    "checkOut": "18:30",
    "status": "Present",
    "notes": "On-Duty regular hours",
    "createdAt": "2026-11-20T04:00:00.000Z"
  },
  {
    "id": "att-bg-1037",
    "employeeId": "EMP-1037",
    "name": "Chandrakala",
    "employeeName": "Chandrakala",
    "email": "chandrakala@atticagold.com",
    "department": "BM",
    "role": "Branch Manager",
    "branch": "Sevanagar",
    "date": "2026-11-20",
    "checkIn": "09:30",
    "checkOut": "18:30",
    "status": "Present",
    "notes": "On-Duty regular hours",
    "createdAt": "2026-11-20T04:00:00.000Z"
  },
  {
    "id": "att-bg-1038",
    "employeeId": "EMP-1038",
    "name": "Manjula M",
    "employeeName": "Manjula M",
    "email": "manjulam@atticagold.com",
    "department": "BM",
    "role": "Branch Manager",
    "branch": "Sunkadakatte",
    "date": "2026-11-20",
    "checkIn": "09:30",
    "checkOut": "18:30",
    "status": "Present",
    "notes": "On-Duty regular hours",
    "createdAt": "2026-11-20T04:00:00.000Z"
  },
  {
    "id": "att-bg-1039",
    "employeeId": "EMP-1039",
    "name": "Vinod kumar",
    "employeeName": "Vinod kumar",
    "email": "vinodkumar@atticagold.com",
    "department": "BM",
    "role": "Branch Manager",
    "branch": "Sunkadakatte 2",
    "date": "2026-11-20",
    "checkIn": "09:30",
    "checkOut": "18:30",
    "status": "Present",
    "notes": "On-Duty regular hours",
    "createdAt": "2026-11-20T04:00:00.000Z"
  },
  {
    "id": "att-bg-1040",
    "employeeId": "EMP-1040",
    "name": "David R",
    "employeeName": "David R",
    "email": "davidr@atticagold.com",
    "department": "BM",
    "role": "Branch Manager",
    "branch": "Sarjapur",
    "date": "2026-11-20",
    "checkIn": "09:30",
    "checkOut": "18:30",
    "status": "Present",
    "notes": "On-Duty regular hours",
    "createdAt": "2026-11-20T04:00:00.000Z"
  },
  {
    "id": "att-bg-1041",
    "employeeId": "EMP-1041",
    "name": "James",
    "employeeName": "James",
    "email": "james@atticagold.com",
    "department": "BM",
    "role": "Branch Manager",
    "branch": "Thanisandra",
    "date": "2026-11-20",
    "checkIn": "09:30",
    "checkOut": "18:30",
    "status": "Present",
    "notes": "Movement: Marathahalli -> Varthur (9066551828)",
    "createdAt": "2026-11-20T04:00:00.000Z"
  },
  {
    "id": "att-bg-1042",
    "employeeId": "EMP-1042",
    "name": "Ashok kumar",
    "employeeName": "Ashok kumar",
    "email": "ashokkumar@atticagold.com",
    "department": "BM",
    "role": "Branch Manager",
    "branch": "Tin Factory",
    "date": "2026-11-20",
    "checkIn": "09:30",
    "checkOut": "18:30",
    "status": "Present",
    "notes": "On-Duty regular hours",
    "createdAt": "2026-11-20T04:00:00.000Z"
  },
  {
    "id": "att-bg-1043",
    "employeeId": "EMP-1043",
    "name": "Samiulla",
    "employeeName": "Samiulla",
    "email": "samiulla@atticagold.com",
    "department": "BM",
    "role": "Branch Manager",
    "branch": "Uttarahalli",
    "date": "2026-11-20",
    "checkIn": "09:30",
    "checkOut": "18:30",
    "status": "Present",
    "notes": "On-Duty regular hours",
    "createdAt": "2026-11-20T04:00:00.000Z"
  },
  {
    "id": "att-bg-1044",
    "employeeId": "EMP-1044",
    "name": "Shwetha",
    "employeeName": "Shwetha",
    "email": "shwetha@atticagold.com",
    "department": "BM",
    "role": "Branch Manager",
    "branch": "Vijayanagar",
    "date": "2026-11-20",
    "checkIn": "09:30",
    "checkOut": "18:30",
    "status": "Present",
    "notes": "On-Duty regular hours",
    "createdAt": "2026-11-20T04:00:00.000Z"
  },
  {
    "id": "att-bg-1045",
    "employeeId": "EMP-1045",
    "name": "Nandhakumari M",
    "employeeName": "Nandhakumari M",
    "email": "nandhakumarim@atticagold.com",
    "department": "ABM",
    "role": "Assistant Branch Manager",
    "branch": "Vignan Nagar",
    "date": "2026-11-20",
    "checkIn": "09:45",
    "checkOut": "18:30",
    "status": "Present",
    "notes": "On-Duty regular hours",
    "createdAt": "2026-11-20T04:15:00.000Z"
  },
  {
    "id": "att-bg-1046",
    "employeeId": "EMP-1046",
    "name": "Basavaraju",
    "employeeName": "Basavaraju",
    "email": "basavaraju@atticagold.com",
    "department": "BM",
    "role": "Branch Manager",
    "branch": "Whitefield",
    "date": "2026-11-20",
    "checkIn": "09:30",
    "checkOut": "18:30",
    "status": "Present",
    "notes": "On-Duty regular hours",
    "createdAt": "2026-11-20T04:00:00.000Z"
  },
  {
    "id": "att-bg-1047",
    "employeeId": "EMP-1047",
    "name": "Arun veigas",
    "employeeName": "Arun veigas",
    "email": "arunveigas@atticagold.com",
    "department": "ABM",
    "role": "Assistant Branch Manager",
    "branch": "Yelahanka",
    "date": "2026-11-20",
    "checkIn": "09:45",
    "checkOut": "18:30",
    "status": "Present",
    "notes": "On-Duty regular hours",
    "createdAt": "2026-11-20T04:15:00.000Z"
  },
  {
    "id": "att-bg-1048",
    "employeeId": "EMP-1048",
    "name": "Rakshith new",
    "employeeName": "Rakshith new",
    "email": "rakshithnew@atticagold.com",
    "department": "BM",
    "role": "Branch Manager",
    "branch": "Yeshwanthpur",
    "date": "2026-11-20",
    "checkIn": "09:30",
    "checkOut": "18:30",
    "status": "Present",
    "notes": "On-Duty regular hours",
    "createdAt": "2026-11-20T04:00:00.000Z"
  },
  {
    "id": "att-bg-1049",
    "employeeId": "EMP-1049",
    "name": "Deeksha H S",
    "employeeName": "Deeksha H S",
    "email": "deekshahs@atticagold.com",
    "department": "BM",
    "role": "Branch Manager",
    "branch": "Yeshwanthpur 2",
    "date": "2026-11-20",
    "checkIn": "09:30",
    "checkOut": "18:30",
    "status": "Present",
    "notes": "On-Duty regular hours",
    "createdAt": "2026-11-20T04:00:00.000Z"
  },
  {
    "id": "att-bg-1050",
    "employeeId": "EMP-1050",
    "name": "Shivashankar S H",
    "employeeName": "Shivashankar S H",
    "email": "shivashankarsh@atticagold.com",
    "department": "BM",
    "role": "Branch Manager",
    "branch": "Ulsoor",
    "date": "2026-11-20",
    "checkIn": "09:30",
    "checkOut": "18:30",
    "status": "Present",
    "notes": "On-Duty regular hours",
    "createdAt": "2026-11-20T04:00:00.000Z"
  },
  {
    "id": "att-bg-1051",
    "employeeId": "EMP-1051",
    "name": "Shivakumar",
    "employeeName": "Shivakumar",
    "email": "shivakumar@atticagold.com",
    "department": "BM",
    "role": "Branch Manager",
    "branch": "8th Mile",
    "date": "2026-11-20",
    "checkIn": "09:30",
    "checkOut": "18:30",
    "status": "Present",
    "notes": "On-Duty regular hours",
    "createdAt": "2026-11-20T04:00:00.000Z"
  },
  {
    "id": "att-bg-1052",
    "employeeId": "EMP-1052",
    "name": "Sevanth P",
    "employeeName": "Sevanth P",
    "email": "sevanthp@atticagold.com",
    "department": "BM",
    "role": "Branch Manager",
    "branch": "Madiwala",
    "date": "2026-11-20",
    "checkIn": "09:30",
    "checkOut": "18:30",
    "status": "Present",
    "notes": "On-Duty regular hours",
    "createdAt": "2026-11-20T04:00:00.000Z"
  },
  {
    "id": "att-bg-1053",
    "employeeId": "EMP-1053",
    "name": "Priyanka",
    "employeeName": "Priyanka",
    "email": "priyanka@atticagold.com",
    "department": "BM",
    "role": "Branch Manager",
    "branch": "Queens Road",
    "date": "2026-11-20",
    "checkIn": "--:--",
    "checkOut": "--:--",
    "status": "Absent",
    "notes": "Reported Leave / Absent",
    "createdAt": "2026-11-20T03:30:00.000Z"
  },
  {
    "id": "att-bg-1054",
    "employeeId": "EMP-1054",
    "name": "Pavithra R",
    "employeeName": "Pavithra R",
    "email": "pavithrar@atticagold.com",
    "department": "BM",
    "role": "Branch Manager",
    "branch": "Kengeri",
    "date": "2026-11-20",
    "checkIn": "--:--",
    "checkOut": "--:--",
    "status": "Absent",
    "notes": "Reported Leave / Absent",
    "createdAt": "2026-11-20T03:30:00.000Z"
  },
  {
    "id": "att-bg-1055",
    "employeeId": "EMP-1055",
    "name": "Ningamma",
    "employeeName": "Ningamma",
    "email": "ningamma@atticagold.com",
    "department": "BM",
    "role": "Branch Manager",
    "branch": "Marathalli",
    "date": "2026-11-20",
    "checkIn": "--:--",
    "checkOut": "--:--",
    "status": "Absent",
    "notes": "Reported Leave / Absent",
    "createdAt": "2026-11-20T03:30:00.000Z"
  },
  {
    "id": "att-bg-1056",
    "employeeId": "EMP-1056",
    "name": "Swathi",
    "employeeName": "Swathi",
    "email": "swathi@atticagold.com",
    "department": "BM",
    "role": "Branch Manager",
    "branch": "Yeshwanthpur 2",
    "date": "2026-11-20",
    "checkIn": "--:--",
    "checkOut": "--:--",
    "status": "Absent",
    "notes": "Reported Leave / Absent",
    "createdAt": "2026-11-20T03:30:00.000Z"
  },
  {
    "id": "att-bg-1057",
    "employeeId": "EMP-1057",
    "name": "Bhagyalakshmi",
    "employeeName": "Bhagyalakshmi",
    "email": "bhagyalakshmi@atticagold.com",
    "department": "BM",
    "role": "Branch Manager",
    "branch": "Hongasandra",
    "date": "2026-11-20",
    "checkIn": "--:--",
    "checkOut": "--:--",
    "status": "Absent",
    "notes": "Reported Leave / Absent",
    "createdAt": "2026-11-20T03:30:00.000Z"
  },
  {
    "id": "att-bg-1058",
    "employeeId": "EMP-1058",
    "name": "Yeshaswini",
    "employeeName": "Yeshaswini",
    "email": "yeshaswini@atticagold.com",
    "department": "BM",
    "role": "Branch Manager",
    "branch": "Peenya-Jallahalli",
    "date": "2026-11-20",
    "checkIn": "--:--",
    "checkOut": "--:--",
    "status": "Absent",
    "notes": "Reported Leave / Absent",
    "createdAt": "2026-11-20T03:30:00.000Z"
  },
  {
    "id": "att-bg-1059",
    "employeeId": "EMP-1059",
    "name": "Tejas",
    "employeeName": "Tejas",
    "email": "tejas@atticagold.com",
    "department": "BM",
    "role": "Branch Manager",
    "branch": "Indiranagar",
    "date": "2026-11-20",
    "checkIn": "--:--",
    "checkOut": "--:--",
    "status": "Absent",
    "notes": "Reported Leave / Absent",
    "createdAt": "2026-11-20T03:30:00.000Z"
  },
  {
    "id": "att-bg-1060",
    "employeeId": "EMP-1060",
    "name": "Santhosh Kumar R",
    "employeeName": "Santhosh Kumar R",
    "email": "santhoshkumarr@atticagold.com",
    "department": "BM",
    "role": "Branch Manager",
    "branch": "Basaveshwara Nagar",
    "date": "2026-11-20",
    "checkIn": "--:--",
    "checkOut": "--:--",
    "status": "Absent",
    "notes": "Reported Leave / Absent",
    "createdAt": "2026-11-20T03:30:00.000Z"
  },
  {
    "id": "att-bg-1061",
    "employeeId": "EMP-1061",
    "name": "Sunitha",
    "employeeName": "Sunitha",
    "email": "sunitha@atticagold.com",
    "department": "BM",
    "role": "Branch Manager",
    "branch": "Kodagehalli",
    "date": "2026-11-20",
    "checkIn": "--:--",
    "checkOut": "--:--",
    "status": "Absent",
    "notes": "Reported Leave / Absent",
    "createdAt": "2026-11-20T03:30:00.000Z"
  },
  {
    "id": "att-bg-1062",
    "employeeId": "EMP-1062",
    "name": "Livingstan",
    "employeeName": "Livingstan",
    "email": "livingstan@atticagold.com",
    "department": "BM",
    "role": "Branch Manager",
    "branch": "Yelahanka",
    "date": "2026-11-20",
    "checkIn": "--:--",
    "checkOut": "--:--",
    "status": "Absent",
    "notes": "Reported Leave / Absent (Ref: 11700)",
    "createdAt": "2026-11-20T03:30:00.000Z"
  }
];

export const MASTER_EMPLOYEES = NOV_20_DATA.map((item) => ({
  employeeId: item.employeeId,
  name: item.name,
  email: item.email,
  department: item.department,
  role: item.role,
  branch: item.branch,
}));

export function generateRosterForDate(targetDate: string): Attendance[] {
  return MASTER_EMPLOYEES.map((emp) => {
    return {
      id: `att-${targetDate}-${(emp.employeeId || 'emp').toLowerCase()}`,
      employeeId: emp.employeeId,
      name: emp.name,
      employeeName: emp.name,
      email: emp.email,
      department: emp.department,
      role: emp.role,
      branch: emp.branch,
      date: targetDate,
      checkIn: '--:--',
      checkOut: '--:--',
      status: 'Pending' as const,
      notes: 'Pending attendance marking / Excel upload',
      createdAt: `${targetDate}T04:00:00.000Z`,
    };
  });
}

export const INITIAL_ATTENDANCE_DATA: Attendance[] = [
  ...NOV_20_DATA,
  ...generateRosterForDate('2026-11-21'),
];

