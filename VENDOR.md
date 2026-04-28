register
{
    name,
    email,
    phone no,
    password,

    full address, (user address and form address are same just one address is enough else need to add address for farm)
    country, default is india not changable
    state, use /shared/loca.json
    district, use /shared/loca.json
    city, use /shared/loca.json
    landmark,
    pincode, 
    
    Digital map pin location,

    farm name,
    farm size,[acre size],
    farm type,[organic,conventional,mixed],
    farm image[upto 3 images],
    logo for farm(optional)[1 image]

    bank name,
    bank account number,
    bank ifsc code,
    bank account holder name,

    User address proof(PAN, DRIVING, VoterID)[selected doc 1 image][selected doc number]

    Patta / Chitta / Adangal (Tamil Nadu land records)
    Land ownership document
    Lease agreement (if farming on rented land)
    Farmer ID card (state-issued)
    Organic certification (if applicable)
    GST(optional)
    
} -> sent to admin for verification then admin check and verify it then only the farmer can login

login {
    email/password
    email/email otp
    phone/phone otp
}

page - dashboard
analytics, sales, revenew, latest order, etc

page - products
CURD products

{
    product name,
    product description,
    product highlights,
    product images[upto 10 images and 1'st image in white bg]
    unit of the product[g,kg,ml,l,pcs,pack,ton,etc]
    price
    discount price
    stock
    category
    sub category
    tags
    
} -> sent to admin for verification then admin check and verify it then only the product will be visible to the user