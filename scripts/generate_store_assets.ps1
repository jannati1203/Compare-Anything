Add-Type -AssemblyName System.Drawing

function Create-DirectoryIfMissing([string]$dir) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Force -Path $dir | Out-Null
    }
}

$assetsDir = "e:\intern\compare-anything\store-assets"
Create-DirectoryIfMissing $assetsDir

# Color Palette
$cBgDark = [System.Drawing.Color]::FromArgb(255, 11, 17, 32)
$cBgCard = [System.Drawing.Color]::FromArgb(255, 30, 41, 59)
$cBgCardSubtle = [System.Drawing.Color]::FromArgb(255, 22, 32, 50)
$cBorder = [System.Drawing.Color]::FromArgb(255, 51, 65, 85)
$cAccentBlue = [System.Drawing.Color]::FromArgb(255, 56, 189, 248)
$cAccentGreen = [System.Drawing.Color]::FromArgb(255, 52, 211, 153)
$cTextWhite = [System.Drawing.Color]::FromArgb(255, 248, 250, 252)
$cTextMuted = [System.Drawing.Color]::FromArgb(255, 148, 163, 184)
$cButtonBlue = [System.Drawing.Color]::FromArgb(255, 37, 99, 235)

function Draw-BaseCanvas([string]$title, [string]$subtitle) {
    $bmp = New-Object System.Drawing.Bitmap(1280, 800)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit

    # Gradient background
    $rect = New-Object System.Drawing.Rectangle(0, 0, 1280, 800)
    $bgBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($rect, $cBgDark, $cBgCard, 45.0)
    $g.FillRectangle($bgBrush, $rect)

    # Title & subtitle
    $fontTitle = New-Object System.Drawing.Font("Segoe UI", 34, [System.Drawing.FontStyle]::Bold)
    $fontSub = New-Object System.Drawing.Font("Segoe UI", 17, [System.Drawing.FontStyle]::Regular)
    $accentBrush = New-Object System.Drawing.SolidBrush($cAccentBlue)
    $mutedBrush = New-Object System.Drawing.SolidBrush($cTextMuted)

    $g.DrawString($title, $fontTitle, $accentBrush, [float]70, [float]50)
    $g.DrawString($subtitle, $fontSub, $mutedBrush, [float]70, [float]110)

    return @{ Bitmap = $bmp; Graphics = $g }
}

# -------------------------------------------------------------
# SCREENSHOT 1: "Add pages you want to compare"
# -------------------------------------------------------------
function Generate-Screenshot1 {
    $c = Draw-BaseCanvas "Add pages you want to compare" "Add 2 to 4 webpages directly from any website with one click"
    $g = $c.Graphics; $bmp = $c.Bitmap

    $px = 400; $py = 180; $pw = 480; $ph = 560
    $pRect = New-Object System.Drawing.Rectangle($px, $py, $pw, $ph)
    $g.FillRectangle((New-Object System.Drawing.SolidBrush($cBgDark)), $pRect)
    $g.DrawRectangle((New-Object System.Drawing.Pen($cBorder, 2)), $pRect)

    # Popup Header
    $fBrand = New-Object System.Drawing.Font("Segoe UI", 16, [System.Drawing.FontStyle]::Bold)
    $fSub = New-Object System.Drawing.Font("Segoe UI", 11, [System.Drawing.FontStyle]::Regular)
    $g.DrawString("COMPARE ANYTHING", $fBrand, (New-Object System.Drawing.SolidBrush($cAccentBlue)), [float]($px + 24), [float]($py + 24))
    $g.DrawString("Stop switching between tabs. Compare them.", $fSub, (New-Object System.Drawing.SolidBrush($cTextMuted)), [float]($px + 24), [float]($py + 54))

    # Badge: 3 / 4 pages added
    $bRect = New-Object System.Drawing.Rectangle(($px + 24), ($py + 85), 432, 38)
    $g.FillRectangle((New-Object System.Drawing.SolidBrush($cBgCard)), $bRect)
    $fBadge = New-Object System.Drawing.Font("Segoe UI", 12, [System.Drawing.FontStyle]::Bold)
    $g.DrawString("Pages to compare (3 / 4)", $fBadge, (New-Object System.Drawing.SolidBrush($cAccentGreen)), [float]($px + 36), [float]($py + 94))

    $items = @(
        @{ Title = "Samsung 32H5000F 32 Inch FHD LED TV"; Domain = "startech.com.bd" },
        @{ Title = "Xiaomi TV A Pro 32-Inch Smart Android TV"; Domain = "startech.com.bd" },
        @{ Title = "Sony Bravia 32W600D 32 Inch Smart TV"; Domain = "ryanscomputers.com" }
    )

    $fCard = New-Object System.Drawing.Font("Segoe UI", 12, [System.Drawing.FontStyle]::Bold)
    $fDom = New-Object System.Drawing.Font("Segoe UI", 10, [System.Drawing.FontStyle]::Regular)

    for ($i = 0; $i -lt 3; $i++) {
        $iy = $py + 135 + ($i * 75)
        $iRect = New-Object System.Drawing.Rectangle(($px + 24), $iy, 432, 64)
        $g.FillRectangle((New-Object System.Drawing.SolidBrush($cBgCardSubtle)), $iRect)
        $g.DrawRectangle((New-Object System.Drawing.Pen($cBorder, 1)), $iRect)

        $g.DrawString($items[$i].Title, $fCard, (New-Object System.Drawing.SolidBrush($cTextWhite)), [float]($px + 36), [float]($iy + 12))
        $g.DrawString($items[$i].Domain, $fDom, (New-Object System.Drawing.SolidBrush($cTextMuted)), [float]($px + 36), [float]($iy + 36))
        $g.DrawString("X", $fCard, (New-Object System.Drawing.SolidBrush($cTextMuted)), [float]($px + 400), [float]($iy + 20))
    }

    # Goal field
    $gRect = New-Object System.Drawing.Rectangle(($px + 24), ($py + 375), 432, 70)
    $g.FillRectangle((New-Object System.Drawing.SolidBrush($cBgCardSubtle)), $gRect)
    $g.DrawRectangle((New-Object System.Drawing.Pen($cBorder, 1)), $gRect)
    $fGoalLbl = New-Object System.Drawing.Font("Segoe UI", 10, [System.Drawing.FontStyle]::Bold)
    $fGoalText = New-Object System.Drawing.Font("Segoe UI", 11, [System.Drawing.FontStyle]::Italic)
    $g.DrawString("What matters to you? -- Optional", $fGoalLbl, (New-Object System.Drawing.SolidBrush($cTextMuted)), [float]($px + 36), [float]($py + 385))
    $g.DrawString("Which TV offers better display quality and warranty?", $fGoalText, (New-Object System.Drawing.SolidBrush($cTextWhite)), [float]($px + 36), [float]($py + 410))

    # Compare button
    $btnRect = New-Object System.Drawing.Rectangle(($px + 24), ($py + 470), 432, 52)
    $g.FillRectangle((New-Object System.Drawing.SolidBrush($cButtonBlue)), $btnRect)
    $fBtn = New-Object System.Drawing.Font("Segoe UI", 14, [System.Drawing.FontStyle]::Bold)
    $g.DrawString("COMPARE 3 PAGES", $fBtn, (New-Object System.Drawing.SolidBrush($cTextWhite)), [float]($px + 135), [float]($py + 482))

    $bmp.Save("$assetsDir\screenshot-1-add-pages.png", [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose(); $bmp.Dispose()
}

# -------------------------------------------------------------
# SCREENSHOT 2: "One clear comparison"
# -------------------------------------------------------------
function Generate-Screenshot2 {
    $c = Draw-BaseCanvas "One clear comparison" "Side-by-side evidence-based comparison matrix automatically tailored to your pages"
    $g = $c.Graphics; $bmp = $c.Bitmap

    $mx = 70; $my = 180; $mw = 1140; $mh = 560
    $mRect = New-Object System.Drawing.Rectangle($mx, $my, $mw, $mh)
    $g.FillRectangle((New-Object System.Drawing.SolidBrush($cBgCard)), $mRect)
    $g.DrawRectangle((New-Object System.Drawing.Pen($cBorder, 1)), $mRect)

    # Header Row
    $fHead = New-Object System.Drawing.Font("Segoe UI", 13, [System.Drawing.FontStyle]::Bold)
    $fDom = New-Object System.Drawing.Font("Segoe UI", 10, [System.Drawing.FontStyle]::Regular)
    $hRect = New-Object System.Drawing.Rectangle($mx, $my, $mw, 60)
    $g.FillRectangle((New-Object System.Drawing.SolidBrush($cBgDark)), $hRect)

    $g.DrawString("Feature / Criterion", $fHead, (New-Object System.Drawing.SolidBrush($cTextMuted)), [float]($mx + 20), [float]($my + 18))
    
    $cols = @(
        @{ Title = "Samsung 32H5000F FHD TV"; Domain = "startech.com.bd" },
        @{ Title = "Xiaomi TV A Pro 32 Smart"; Domain = "startech.com.bd" },
        @{ Title = "Sony Bravia 32W600D TV"; Domain = "ryanscomputers.com" }
    )

    for ($i = 0; $i -lt 3; $i++) {
        $cx = $mx + 280 + ($i * 280)
        $g.DrawString($cols[$i].Title, $fHead, (New-Object System.Drawing.SolidBrush($cTextWhite)), [float]$cx, [float]($my + 12))
        $g.DrawString($cols[$i].Domain, $fDom, (New-Object System.Drawing.SolidBrush($cTextMuted)), [float]$cx, [float]($my + 34))
    }

    # Data Rows
    $rows = @(
        @{ Name = "Screen Resolution"; V1 = "[Winner] 1920 x 1080 (FHD)"; V2 = "1366 x 768 (HD)"; V3 = "1366 x 768 (HD)" },
        @{ Name = "Audio System"; V1 = "20W Dolby Digital Plus"; V2 = "[Winner] 2x 10W Dolby, DTS-X"; V3 = "10W Bass Reflex" },
        @{ Name = "Smart TV OS"; V1 = "Not stated"; V2 = "[Winner] Google TV (Android)"; V3 = "Smart Linux OS" },
        @{ Name = "Official Warranty"; V1 = "[Winner] 2 Years Official"; V2 = "1 Year Official"; V3 = "1 Year Official" },
        @{ Name = "Price (BDT)"; V1 = "24,500 BDT"; V2 = "[Winner] 21,990 BDT"; V3 = "27,500 BDT" },
        @{ Name = "Bluetooth"; V1 = "Not stated"; V2 = "[Winner] Bluetooth 5.0"; V3 = "Not stated" }
    )

    $fRowName = New-Object System.Drawing.Font("Segoe UI", 12, [System.Drawing.FontStyle]::Bold)
    $fVal = New-Object System.Drawing.Font("Segoe UI", 12, [System.Drawing.FontStyle]::Regular)
    $fValWin = New-Object System.Drawing.Font("Segoe UI", 12, [System.Drawing.FontStyle]::Bold)

    for ($r = 0; $r -lt 6; $r++) {
        $ry = $my + 60 + ($r * 78)
        $rowRect = New-Object System.Drawing.Rectangle($mx, $ry, $mw, 78)
        if ($r % 2 -eq 1) {
            $g.FillRectangle((New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(40, 255, 255, 255))), $rowRect)
        }
        $g.DrawLine((New-Object System.Drawing.Pen($cBorder, 1)), [float]$mx, [float]($ry + 78), [float]($mx + $mw), [float]($ry + 78))

        $g.DrawString($rows[$r].Name, $fRowName, (New-Object System.Drawing.SolidBrush($cTextWhite)), [float]($mx + 20), [float]($ry + 26))

        $vals = @($rows[$r].V1, $rows[$r].V2, $rows[$r].V3)
        for ($cIdx = 0; $cIdx -lt 3; $cIdx++) {
            $vx = $mx + 280 + ($cIdx * 280)
            $valText = $vals[$cIdx]
            if ($valText -like "*[Winner]*") {
                $cleanText = $valText.Replace("[Winner]", "*")
                $g.DrawString($cleanText, $fValWin, (New-Object System.Drawing.SolidBrush($cAccentGreen)), [float]$vx, [float]($ry + 26))
            } elseif ($valText -eq "Not stated") {
                $g.DrawString($valText, $fVal, (New-Object System.Drawing.SolidBrush($cTextMuted)), [float]$vx, [float]($ry + 26))
            } else {
                $g.DrawString($valText, $fVal, (New-Object System.Drawing.SolidBrush($cTextWhite)), [float]$vx, [float]($ry + 26))
            }
        }
    }

    $bmp.Save("$assetsDir\screenshot-2-comparison-table.png", [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose(); $bmp.Dispose()
}

# -------------------------------------------------------------
# SCREENSHOT 3: "Compare based on what matters to you"
# -------------------------------------------------------------
function Generate-Screenshot3 {
    $c = Draw-BaseCanvas "Compare based on what matters to you" "Input your personal priority -- the AI weights criteria to find the right match"
    $g = $c.Graphics; $bmp = $c.Bitmap

    # Priority Goal Card
    $gx = 70; $gy = 180; $gw = 1140; $gh = 100
    $gRect = New-Object System.Drawing.Rectangle($gx, $gy, $gw, $gh)
    $g.FillRectangle((New-Object System.Drawing.SolidBrush($cBgCard)), $gRect)
    $g.DrawRectangle((New-Object System.Drawing.Pen($cAccentBlue, 2)), $gRect)

    $fLbl = New-Object System.Drawing.Font("Segoe UI", 12, [System.Drawing.FontStyle]::Bold)
    $fGoal = New-Object System.Drawing.Font("Segoe UI", 20, [System.Drawing.FontStyle]::Bold)
    $g.DrawString("YOUR PRIORITY GOAL", $fLbl, (New-Object System.Drawing.SolidBrush($cAccentBlue)), [float]($gx + 28), [float]($gy + 18))
    $g.DrawString("'Best for programming under Tk 80,000'", $fGoal, (New-Object System.Drawing.SolidBrush($cTextWhite)), [float]($gx + 28), [float]($gy + 44))

    # Evaluation breakdown cards
    $cards = @(
        @{ Title = "ASUS VivoBook 15 (Ryzen 5, 16GB RAM)"; Price = "74,500 BDT"; Status = "Top Match for Student Programming"; Match = "* High Priority Match" },
        @{ Title = "Lenovo IdeaPad Slim 3 (Core i5, 8GB RAM)"; Price = "78,000 BDT"; Status = "Good processor, upgradeable RAM needed"; Match = "Alternative Match" },
        @{ Title = "HP 15s (Core i3, 8GB RAM)"; Price = "62,000 BDT"; Status = "Budget-friendly, lower CPU for heavy IDEs"; Match = "Budget Pick" }
    )

    for ($i = 0; $i -lt 3; $i++) {
        $cy = 310 + ($i * 135)
        $cRect = New-Object System.Drawing.Rectangle($gx, $cy, $gw, 115)
        $g.FillRectangle((New-Object System.Drawing.SolidBrush($cBgCardSubtle)), $cRect)
        $g.DrawRectangle((New-Object System.Drawing.Pen($cBorder, 1)), $cRect)

        $fTitle = New-Object System.Drawing.Font("Segoe UI", 16, [System.Drawing.FontStyle]::Bold)
        $fPrice = New-Object System.Drawing.Font("Segoe UI", 14, [System.Drawing.FontStyle]::Bold)
        $fDesc = New-Object System.Drawing.Font("Segoe UI", 12, [System.Drawing.FontStyle]::Regular)
        $fBadge = New-Object System.Drawing.Font("Segoe UI", 11, [System.Drawing.FontStyle]::Bold)

        $g.DrawString($cards[$i].Title, $fTitle, (New-Object System.Drawing.SolidBrush($cTextWhite)), [float]($gx + 24), [float]($cy + 18))
        $g.DrawString($cards[$i].Price, $fPrice, (New-Object System.Drawing.SolidBrush($cAccentGreen)), [float]($gx + $gw - 150), [float]($cy + 18))
        $g.DrawString($cards[$i].Status, $fDesc, (New-Object System.Drawing.SolidBrush($cTextMuted)), [float]($gx + 24), [float]($cy + 52))
        $g.DrawString($cards[$i].Match, $fBadge, (New-Object System.Drawing.SolidBrush($cAccentBlue)), [float]($gx + 24), [float]($cy + 80))
    }

    $bmp.Save("$assetsDir\screenshot-3-personal-priority.png", [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose(); $bmp.Dispose()
}

# -------------------------------------------------------------
# SCREENSHOT 4: "Make decisions faster"
# -------------------------------------------------------------
function Generate-Screenshot4 {
    $c = Draw-BaseCanvas "Make decisions faster" "Clear Best Overall recommendation and categorized Best For use cases"
    $g = $c.Graphics; $bmp = $c.Bitmap

    # Best Overall Highlight Card
    $ox = 70; $oy = 180; $ow = 1140; $oh = 170
    $oRect = New-Object System.Drawing.Rectangle($ox, $oy, $ow, $oh)
    $g.FillRectangle((New-Object System.Drawing.SolidBrush($cBgCard)), $oRect)
    $g.DrawRectangle((New-Object System.Drawing.Pen($cAccentGreen, 2)), $oRect)

    $fLbl = New-Object System.Drawing.Font("Segoe UI", 12, [System.Drawing.FontStyle]::Bold)
    $fWinner = New-Object System.Drawing.Font("Segoe UI", 24, [System.Drawing.FontStyle]::Bold)
    $fReason = New-Object System.Drawing.Font("Segoe UI", 13, [System.Drawing.FontStyle]::Regular)

    $g.DrawString("BEST OVERALL RECOMMENDATION", $fLbl, (New-Object System.Drawing.SolidBrush($cAccentGreen)), [float]($ox + 30), [float]($oy + 22))
    $g.DrawString("ASUS VivoBook 15 OLED", $fWinner, (New-Object System.Drawing.SolidBrush($cTextWhite)), [float]($ox + 30), [float]($oy + 52))
    $g.DrawString("Based on verified evidence from your pages: Offers 16GB DDR5 RAM, Ryzen 5 7530U, and an OLED panel under Tk 75,000.", $fReason, (New-Object System.Drawing.SolidBrush($cTextMuted)), [float]($ox + 30), [float]($oy + 105))

    # Best For Grid
    $fSubSec = New-Object System.Drawing.Font("Segoe UI", 16, [System.Drawing.FontStyle]::Bold)
    $g.DrawString("Best For Specific Needs", $fSubSec, (New-Object System.Drawing.SolidBrush($cAccentBlue)), [float]$ox, [float]380)

    $bestFor = @(
        @{ Label = "Best for Display Quality"; Item = "ASUS VivoBook 15 OLED"; Reason = "True FHD OLED with 100% DCI-P3 color gamut." },
        @{ Label = "Best for Keyboard & Typing"; Item = "Lenovo ThinkPad E14"; Reason = "Legendary spill-resistant ergonomic keyboard." },
        @{ Label = "Best for Battery Life"; Item = "MacBook Air M2"; Reason = "Up to 18 hours verified battery endurance." },
        @{ Label = "Best for Budget Value"; Item = "Acer Aspire 5"; Reason = "Lowest entry price with modern quad-core performance." }
    )

    for ($i = 0; $i -lt 4; $i++) {
        $bx = $ox + ($i % 2 * 580)
        $by = 420 + ([Math]::Floor($i / 2) * 140)
        $bRect = New-Object System.Drawing.Rectangle($bx, $by, 560, 120)
        $g.FillRectangle((New-Object System.Drawing.SolidBrush($cBgCardSubtle)), $bRect)
        $g.DrawRectangle((New-Object System.Drawing.Pen($cBorder, 1)), $bRect)

        $fBfLbl = New-Object System.Drawing.Font("Segoe UI", 13, [System.Drawing.FontStyle]::Bold)
        $fBfItem = New-Object System.Drawing.Font("Segoe UI", 15, [System.Drawing.FontStyle]::Bold)
        $fBfReas = New-Object System.Drawing.Font("Segoe UI", 11, [System.Drawing.FontStyle]::Regular)

        $g.DrawString($bestFor[$i].Label, $fBfLbl, (New-Object System.Drawing.SolidBrush($cAccentBlue)), [float]($bx + 20), [float]($by + 16))
        $g.DrawString($bestFor[$i].Item, $fBfItem, (New-Object System.Drawing.SolidBrush($cTextWhite)), [float]($bx + 20), [float]($by + 44))
        $g.DrawString($bestFor[$i].Reason, $fBfReas, (New-Object System.Drawing.SolidBrush($cTextMuted)), [float]($bx + 20), [float]($by + 78))
    }

    $bmp.Save("$assetsDir\screenshot-4-best-overall.png", [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose(); $bmp.Dispose()
}

# -------------------------------------------------------------
# SCREENSHOT 5: "Compare more than products"
# -------------------------------------------------------------
function Generate-Screenshot5 {
    $c = Draw-BaseCanvas "Compare more than products" "Dynamic comparison across Jobs, Courses, Software Plans, Hotels & Services"
    $g = $c.Graphics; $bmp = $c.Bitmap

    $categories = @(
        @{ Title = "[Products]"; Example = "Laptops, Phones, TVs, Appliances"; Specs = "Resolution, CPU, RAM, Battery, Price" },
        @{ Title = "[Jobs & Careers]"; Example = "Frontend vs Fullstack vs Backend"; Specs = "Salary, Remote Policy, Stack, Benefits" },
        @{ Title = "[Courses & Bootcamps]"; Example = "React Bootcamp vs CS Degree"; Specs = "Curriculum, Duration, Mentorship, Cost" },
        @{ Title = "[Software Plans]"; Example = "Pro vs Enterprise SaaS Plans"; Specs = "Seats, API Limits, SLA, Support, Pricing" },
        @{ Title = "[Hotels & Travel]"; Example = "City Hotel vs Beach Resort"; Specs = "Room Type, Amenities, Location, Policies" },
        @{ Title = "[Services]"; Example = "Cloud Hosting vs Dedicated VPS"; Specs = "Uptime, Bandwidth, Backups, Migration" }
    )

    for ($i = 0; $i -lt 6; $i++) {
        $col = $i % 3
        $row = [Math]::Floor($i / 3)
        $cx = 70 + ($col * 390)
        $cy = 190 + ($row * 260)
        $cRect = New-Object System.Drawing.Rectangle($cx, $cy, 360, 230)

        $g.FillRectangle((New-Object System.Drawing.SolidBrush($cBgCard)), $cRect)
        $g.DrawRectangle((New-Object System.Drawing.Pen($cBorder, 1)), $cRect)

        $fCatTitle = New-Object System.Drawing.Font("Segoe UI", 18, [System.Drawing.FontStyle]::Bold)
        $fCatEx = New-Object System.Drawing.Font("Segoe UI", 12, [System.Drawing.FontStyle]::Bold)
        $fCatSpecs = New-Object System.Drawing.Font("Segoe UI", 11, [System.Drawing.FontStyle]::Regular)

        $g.DrawString($categories[$i].Title, $fCatTitle, (New-Object System.Drawing.SolidBrush($cAccentBlue)), [float]($cx + 20), [float]($cy + 22))
        $g.DrawString($categories[$i].Example, $fCatEx, (New-Object System.Drawing.SolidBrush($cTextWhite)), [float]($cx + 20), [float]($cy + 75))
        
        $g.DrawString("Discovered criteria:", $fCatSpecs, (New-Object System.Drawing.SolidBrush($cAccentGreen)), [float]($cx + 20), [float]($cy + 120))
        $g.DrawString($categories[$i].Specs, $fCatSpecs, (New-Object System.Drawing.SolidBrush($cTextMuted)), [float]($cx + 20), [float]($cy + 145))
    }

    $bmp.Save("$assetsDir\screenshot-5-multi-category.png", [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose(); $bmp.Dispose()
}

# -------------------------------------------------------------
# PROMO TILE: 440 x 280
# -------------------------------------------------------------
function Generate-PromoTile {
    $bmp = New-Object System.Drawing.Bitmap(440, 280)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit

    $rect = New-Object System.Drawing.Rectangle(0, 0, 440, 280)
    $bgBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($rect, $cBgDark, $cBgCard, 45.0)
    $g.FillRectangle($bgBrush, $rect)

    # Icon symbol
    $iconX = 40; $iconY = 35; $iconSize = 50
    $iRect = New-Object System.Drawing.Rectangle($iconX, $iconY, $iconSize, $iconSize)
    $iBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($iRect, $cButtonBlue, [System.Drawing.Color]::FromArgb(255, 79, 70, 229), 45.0)
    $g.FillEllipse($iBrush, $iRect)

    # Brand Title
    $fTitle = New-Object System.Drawing.Font("Segoe UI", 18, [System.Drawing.FontStyle]::Bold)
    $g.DrawString("COMPARE ANYTHING", $fTitle, (New-Object System.Drawing.SolidBrush($cTextWhite)), [float]105, [float]38)

    $fSub = New-Object System.Drawing.Font("Segoe UI", 10, [System.Drawing.FontStyle]::Bold)
    $g.DrawString("AI Web Comparison Engine", $fSub, (New-Object System.Drawing.SolidBrush($cAccentBlue)), [float]107, [float]65)

    # Main Tagline
    $fTag = New-Object System.Drawing.Font("Segoe UI", 14, [System.Drawing.FontStyle]::Bold)
    $g.DrawString("Stop switching between tabs.`nCompare them.", $fTag, (New-Object System.Drawing.SolidBrush($cTextWhite)), [float]40, [float]110)

    # Feature points
    $fFeat = New-Object System.Drawing.Font("Segoe UI", 10, [System.Drawing.FontStyle]::Regular)
    $g.DrawString("* Compare 2-4 webpages side-by-side`n* Strictly evidence-based, zero hallucination`n* Discovers dynamic criteria across all categories", $fFeat, (New-Object System.Drawing.SolidBrush($cTextMuted)), [float]40, [float]180)

    $bmp.Save("$assetsDir\promo-440x280.png", [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose(); $bmp.Dispose()
}

Generate-Screenshot1
Generate-Screenshot2
Generate-Screenshot3
Generate-Screenshot4
Generate-Screenshot5
Generate-PromoTile
Write-Host "All store assets successfully created in $assetsDir!"
