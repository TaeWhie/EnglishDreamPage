with open(r'C:\Users\User\Desktop\EnglishDreamPage\index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# The marker to find where we need to insert
HEADER_END = """            </div>
            
                <!-- 3F -->"""

NEW_SECTION = """            </div>

            <div class="curriculum-layout">
                <div class="curriculum-tower">
                    <!-- 1F -->
                    <div class="tower-floor fade-in">
                        <div class="floor-marker" style="background-color: #9C27B0;"></div>
                        <div class="floor-content">
                            <h3><span>1F</span> \u2014 Foundation Zone</h3>
                            <p>\uc9c0\uc2dd\u00b7\uae30\ucd08\ud68c\ud654\u00b7\ud328\ud134 \ud559\uc2b5\uc744 \ud1b5\ud574<br>\uc601\uc5b4 \ubb38\uc7a5\uc744 '\ub9cc\ub4e4\uc5b4 \ub9d0\ud558\ub294 \ud798'\uc744 \uae30\ub974\ub294 \ub2e8\uacc4\uc785\ub2c8\ub2e4.<br>\uc601\uc5b4\uac00 \ub450\ub835\uc9c0 \uc54a\uace0, \uc785\uc774 \uc5f4\ub9ac\uae30 \uc2dc\uc791\ud569\ub2c8\ub2e4.</p>
                        </div>
                    </div>
                    <!-- 2F -->
                    <div class="tower-floor fade-in" style="transition-delay: 0.1s;">
                        <div class="floor-marker" style="background-color: #1976D2;"></div>
                        <div class="floor-content">
                            <h3><span>2F</span> \u2014 Daily Speaking Zone</h3>
                            <p>\uc2e4\uc0dd\ud65c \ud45c\ud604\u00b7\uc2a4\ubab0\ud1a0\ud06c\u00b7\uc2e4\uc804\ub300\ud654\ub97c \ud1b5\ud574<br>\uc77c\uc0c1\uc5d0\uc11c \uc790\uc5f0\uc2a4\ub7fd\uac8c \ub9d0\ud558\ub294 \uac10\uac01\uc744 \ub9cc\ub4ed\ub2c8\ub2e4.<br>"\uc774\ud574\ud558\ub294 \uc601\uc5b4 \u2192 \ub9d0\ud558\ub294 \uc601\uc5b4"\ub85c \uc804\ud658\ub418\ub294 \uad6c\uac04\uc785\ub2c8\ub2e4.</p>
                        </div>
                    </div>
                    <!-- 3F -->"""

FLOOR_4_AND_BELOW = """                <!-- 3F -->"""

if HEADER_END in content:
    content = content.replace(HEADER_END, NEW_SECTION, 1)
    print('Step 1: header replaced OK')
else:
    print('Step 1 FAILED: header end not found')

# Now close the curriculum-tower div and add the image col before </section>
OLD_CLOSE = """            </div>
        </div>
    </section>

    <!-- Policy Section -->"""

NEW_CLOSE = """                </div>
                <div class="curriculum-image-col fade-in">
                    <img src="images/curriculum_tower.png" alt="\ub4dc\ub9bc \ud0c0\uc6cc \ucee4\ub9ac\ud058\ub7fc" class="curriculum-tower-img">
                </div>
            </div>
        </div>
    </section>

    <!-- Policy Section -->"""

if OLD_CLOSE in content:
    content = content.replace(OLD_CLOSE, NEW_CLOSE, 1)
    print('Step 2: close replaced OK')
else:
    print('Step 2 FAILED: close tag not found')

with open(r'C:\Users\User\Desktop\EnglishDreamPage\index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print('Done')
