with open(r'C:\Users\User\Desktop\EnglishDreamPage\index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace titles with beautiful span numbers
replacements = {
    '<h3>01. 검증된 원어민 선생님</h3>': '<h3><span>01</span> 검증된 원어민 선생님</h3>',
    '<h3>02. 20가지 이상 맞춤 커리큘럼!</h3>': '<h3><span>02</span> 20가지 이상 맞춤 커리큘럼!</h3>',
    '<h3>03. 왕초보부터 원어민 수준까지</h3>': '<h3><span>03</span> 왕초보부터 원어민 수준까지</h3>',
    '<h3>04. 실시간 일대일 원어민 수업</h3>': '<h3><span>04</span> 실시간 일대일 원어민 수업</h3>',
    '<h3>05. 관리형 학습 시스템</h3>': '<h3><span>05</span> 관리형 학습 시스템</h3>',
    '<h3>06. 수업 외 시간까지 더욱 더 학습 효과 극대화! Booster!</h3>': '<h3><span>06</span> 수업 외 시간 극대화! Booster!</h3>'
}

for old, new in replacements.items():
    if old in content:
        content = content.replace(old, new)
        print(f"Replaced {old} -> {new}")
    else:
        print(f"FAILED to find {old}")

with open(r'C:\Users\User\Desktop\EnglishDreamPage\index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done HTML parsing")
