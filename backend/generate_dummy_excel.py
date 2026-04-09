import pandas as pd

# 20 realistic Johannesburg/Gauteng delivery addresses
orders = [
    ["ORD-001", "Sipho Supermarket", "123 Jan Smuts Avenue, Rosebank, Johannesburg, 2196", 12, "08:00", "10:00", 15, "0821234567", "Leave at reception"],
    ["ORD-002", "Mpho Spaza", "45 Commissioner St, Johannesburg, 2001", 8, "09:00", "11:00", 10, "0832345678", "Call on arrival"],
    ["ORD-003", "Thandi Grocers", "78 Rivonia Rd, Sandton, Johannesburg, 2196", 20, "10:00", "12:00", 20, "0843456789", "Deliver to loading bay"],
    ["ORD-004", "Jabu Mini Mart", "12 Eloff St, Johannesburg, 2001", 5, "", "", 8, "0824567890", ""],
    ["ORD-005", "Lebo's Fresh", "5 Main Rd, Melville, Johannesburg, 2092", 15, "11:00", "13:00", 12, "0835678901", "Fragile items"],
    ["ORD-006", "Zanele's Store", "34 Empire Rd, Parktown, Johannesburg, 2193", 10, "08:30", "10:30", 10, "0846789012", ""],
    ["ORD-007", "Nhlanhla Foods", "99 Oxford Rd, Houghton, Johannesburg, 2198", 18, "09:30", "11:30", 18, "0827890123", "Ring bell twice"],
    ["ORD-008", "Nomsa's Deli", "22 Simmonds St, Marshalltown, Johannesburg, 2107", 7, "10:00", "12:00", 9, "0838901234", ""],
    ["ORD-009", "Bongani Market", "56 Beyers Naude Dr, Northcliff, Johannesburg, 2195", 14, "11:00", "13:00", 14, "0849012345", ""],
    ["ORD-010", "Gugu's Groceries", "3 Louis Botha Ave, Orange Grove, Johannesburg, 2192", 6, "08:00", "10:00", 7, "0820123456", ""],
    ["ORD-011", "Sizwe Supplies", "17 Fox St, Johannesburg, 2001", 9, "09:00", "11:00", 11, "0831234567", ""],
    ["ORD-012", "Dineo's Depot", "88 Jan Smuts Ave, Parkwood, Johannesburg, 2193", 13, "10:00", "12:00", 13, "0842345678", ""],
    ["ORD-013", "Kabelo Kiosk", "21 De Korte St, Braamfontein, Johannesburg, 2001", 4, "11:00", "13:00", 6, "0823456789", ""],
    ["ORD-014", "Palesa's Place", "67 Empire Rd, Parktown, Johannesburg, 2193", 11, "08:30", "10:30", 12, "0834567890", ""],
    ["ORD-015", "Tshepo Traders", "40 Main St, Johannesburg, 2001", 16, "09:30", "11:30", 15, "0845678901", ""],
    ["ORD-016", "Lindiwe's Shop", "29 Grant Ave, Norwood, Johannesburg, 2192", 8, "10:00", "12:00", 8, "0826789012", ""],
    ["ORD-017", "Mandla Mart", "14 4th Ave, Parkhurst, Johannesburg, 2193", 17, "11:00", "13:00", 17, "0837890123", ""],
    ["ORD-018", "Ayanda's Foods", "2 Barry Hertzog Ave, Emmarentia, Johannesburg, 2195", 10, "08:00", "10:00", 10, "0848901234", ""],
    ["ORD-019", "Sibongile Store", "55 7th St, Linden, Johannesburg, 2195", 7, "09:00", "11:00", 7, "0829012345", ""],
    ["ORD-020", "Vusi's Veggies", "101 Greenway, Greenside, Johannesburg, 2193", 12, "10:00", "12:00", 12, "0830123456", ""],
    ["ORD-021", "Zama's Market", "8 1st Ave, Melville, Johannesburg, 2092", 6, "11:00", "13:00", 6, "0841234567", ""],
    ["ORD-022", "Khanyi's Corner", "77 2nd Ave, Parktown North, Johannesburg, 2193", 9, "08:30", "10:30", 9, "0822345678", ""],
    ["ORD-023", "Busi's Basket", "33 3rd Ave, Parkhurst, Johannesburg, 2193", 15, "09:30", "11:30", 15, "0833456789", ""],
    ["ORD-024", "Sifiso's Shop", "44 4th Ave, Parktown North, Johannesburg, 2193", 11, "10:00", "12:00", 11, "0844567890", ""],
    ["ORD-025", "Lerato's Grocers", "66 5th Ave, Melville, Johannesburg, 2092", 13, "11:00", "13:00", 13, "0825678901", ""],
]

columns = [
    "Order_ID",
    "Customer_Name",
    "Full_Address",
    "Demand",
    "Time_Window_Start",
    "Time_Window_End",
    "Service_Time",
    "Phone",
    "Notes"
]

df = pd.DataFrame(orders, columns=columns)
df.to_excel("dummy_orders.xlsx", index=False)
print("Dummy Excel file generated as dummy_orders.xlsx")
