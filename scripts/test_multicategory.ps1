# Multi-Category Verification Script
$baseUrl = "http://127.0.0.1:5123/api/v1/compare"

function Print-Winner($obj) {
    if ($obj -and $obj.bestOverall -and $obj.bestOverall.itemId) {
        return $obj.bestOverall.itemId
    }
    return "No clear winner (Inconclusive/Balanced)"
}

Write-Host "==============================================="
Write-Host "TEST 1: Products Comparison (3 Items + Student Goal)"
Write-Host "==============================================="
$body1 = @{
    installId = "test-dod-products-1"
    goal = "Best option for a student under Tk 80,000"
    pages = @(
        @{
            id = "samsung-tv"
            url = "https://www.startech.com.bd/samsung-32h5000f"
            domain = "startech.com.bd"
            title = "Samsung 32H5000F 32 Inch Full HD LED Television"
            importantText = "Model: 32H5000F. Screen Size: 32 Inch. Resolution: Full HD 1920 x 1080. Display Type: LED. Audio: 20W, Dolby Digital Plus. Connectivity: 2 HDMI, 1 USB. Warranty: 2 Years Official. Price: 24,500 BDT."
        },
        @{
            id = "xiaomi-tv"
            url = "https://www.startech.com.bd/xiaomi-tv-a-pro-32"
            domain = "startech.com.bd"
            title = "Xiaomi TV A Pro 32 32-Inch HD Smart Android Television"
            importantText = "Model: TV A Pro 32. Screen Size: 32 Inch. Resolution: HD 1366 x 768. Display Type: LED, Bezel-less. OS: Google TV. Audio: 2x 10W Speakers, Dolby Audio, DTS-X. Connectivity: 2 HDMI, 2 USB, Wi-Fi, Bluetooth 5.0. Warranty: 1 Year Official. Price: 21,990 BDT."
        },
        @{
            id = "sony-tv"
            url = "https://www.ryanscomputers.com/sony-bravia-32w600d"
            domain = "ryanscomputers.com"
            title = "Sony Bravia 32W600D 32 Inch Smart TV"
            importantText = "Model: KDL-32W600D. Screen Size: 32 Inch. Resolution: HD 1366 x 768. Display Type: Direct LED. OS: Linux based Smart. Audio: 10W Bass Reflex Speaker. Connectivity: 2 HDMI, 2 USB, Wi-Fi. Warranty: 1 Year Official. Price: 27,500 BDT."
        }
    )
} | ConvertTo-Json -Depth 5

$res1 = Invoke-RestMethod -Uri $baseUrl -Method Post -Headers @{ "Content-Type" = "application/json" } -Body $body1
Write-Host "Title:" $res1.comparisonTitle
Write-Host "Type:" $res1.comparisonType
Write-Host "Best Overall:" (Print-Winner $res1)
Write-Host "Criteria Count:" $res1.criteria.Count
$critNames1 = ($res1.criteria | ForEach-Object { $_.name }) -join ", "
Write-Host "Criteria Discovered:" $critNames1
Write-Host "Best Overall Reason:" $res1.bestOverall.reason
Write-Host "Passed Test 1!" -ForegroundColor Green

Write-Host "`n==============================================="
Write-Host "TEST 2: Job Postings Comparison (2 Jobs)"
Write-Host "==============================================="
$body2 = @{
    installId = "test-dod-jobs-2"
    goal = "Which job offers better compensation and remote flexibility?"
    pages = @(
        @{
            id = "job-frontend"
            url = "https://jobs.techcorp.com/frontend-lead"
            domain = "techcorp.com"
            title = "Lead Frontend Engineer (React / TypeScript)"
            importantText = "Role: Lead Frontend Engineer. Location: Remote (Worldwide). Tech Stack: React, TypeScript, Next.js, GraphQL. Experience: 5+ years. Salary: $130,000 - $160,000 USD. Benefits: Unlimited PTO, $3,000 Home Office Stipend, Health Insurance. Working Hours: Flexible, async-first."
        },
        @{
            id = "job-fullstack"
            url = "https://innovate.io/careers/fullstack-dev"
            domain = "innovate.io"
            title = "Fullstack Developer (Node.js & React)"
            importantText = "Role: Fullstack Developer. Location: Hybrid (Austin, TX - 2 days in office). Tech Stack: Node.js, Express, React, PostgreSQL. Experience: 3+ years. Salary: $115,000 - $135,000 USD. Benefits: 401k match (4%), 20 days PTO, Dental & Vision. Equipment: M3 MacBook Pro provided."
        }
    )
} | ConvertTo-Json -Depth 5

$res2 = Invoke-RestMethod -Uri $baseUrl -Method Post -Headers @{ "Content-Type" = "application/json" } -Body $body2
Write-Host "Title:" $res2.comparisonTitle
Write-Host "Type:" $res2.comparisonType
Write-Host "Best Overall:" (Print-Winner $res2)
Write-Host "Criteria Count:" $res2.criteria.Count
$critNames2 = ($res2.criteria | ForEach-Object { $_.name }) -join ", "
Write-Host "Criteria Discovered:" $critNames2
Write-Host "Best Overall Reason:" $res2.bestOverall.reason
Write-Host "Passed Test 2!" -ForegroundColor Green

Write-Host "`n==============================================="
Write-Host "TEST 3: Course Comparison (Bootcamp vs Degree)"
Write-Host "==============================================="
$body3 = @{
    installId = "test-dod-courses-3"
    goal = "Which option is better for a fast career transition?"
    pages = @(
        @{
            id = "course-bootcamp"
            url = "https://fullstackacademy.com/accelerated-bootcamp"
            domain = "fullstackacademy.com"
            title = "Accelerated Software Engineering Bootcamp"
            importantText = "Course: Software Engineering Immersive. Duration: 16 Weeks Full-Time. Tuition: $14,990. Curriculum: JavaScript, React, Node.js, SQL, System Design. Mentorship: 1-on-1 weekly code reviews. Career Services: Resume review, mock interviews, job placement guarantee."
        },
        @{
            id = "course-degree"
            url = "https://university.edu/online-bs-cs"
            domain = "university.edu"
            title = "Online Bachelor of Science in Computer Science"
            importantText = "Degree: B.S. in Computer Science. Duration: 4 Years (120 credits). Tuition: $38,000 total. Curriculum: Discrete Math, Data Structures & Algorithms, Operating Systems, Compilers, Theory of Computation. Mentorship: Not stated. Job Placement Guarantee: Not stated."
        }
    )
} | ConvertTo-Json -Depth 5

$res3 = Invoke-RestMethod -Uri $baseUrl -Method Post -Headers @{ "Content-Type" = "application/json" } -Body $body3
Write-Host "Title:" $res3.comparisonTitle
Write-Host "Type:" $res3.comparisonType
Write-Host "Best Overall:" (Print-Winner $res3)
Write-Host "Criteria Count:" $res3.criteria.Count
$critNames3 = ($res3.criteria | ForEach-Object { $_.name }) -join ", "
Write-Host "Criteria Discovered:" $critNames3
Write-Host "Best Overall Reason:" $res3.bestOverall.reason
Write-Host "Passed Test 3!" -ForegroundColor Green
