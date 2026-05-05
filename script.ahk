#Requires AutoHotkey v2.0
#SingleInstance Force

version := "1.2"

global running := false
global pos1 := {x: 0, y: 0}
global pos2 := {x: 0, y: 0}
global targetWin := "ahk_exe RobloxPlayerBeta.exe"

global phase1Delay := 2000
global phase2Delay := 500   ; hidden script-only setting
global phase1Duration := 150000
global buyClickCount := 5

global darkMode := false
global buyPacksEnabled := true

CoordMode "Mouse", "Client"

; ================= GUI =================
GuiClass := Gui
myGui := GuiClass("+AlwaysOnTop")
myGui.SetFont("s10", "Segoe UI")
myGui.Title := "g's oil empire macros"

statusText := myGui.AddText("x10 y10 w250", "Status: Stopped")
myGui.AddText("x10 y35 w320", "F8 = Set Kingdom | F9 = Set Buy | F7 = Start/Stop")

; ===== Collect interval =====
myGui.AddText("x10 y70 w100", "Collect ms:")
input1 := myGui.AddEdit("x110 y67 w80", phase1Delay)

; ===== Collect duration =====
myGui.AddText("x10 y105 w100", "Duration:")
input3 := myGui.AddEdit("x110 y102 w80", phase1Duration)

myGui.AddButton("x200 y100 w45", "2.5m").OnEvent("Click", (*) => input3.Value := 150000)
myGui.AddButton("x250 y100 w40", "5m").OnEvent("Click", (*) => input3.Value := 300000)
myGui.AddButton("x295 y100 w45", "10m").OnEvent("Click", (*) => input3.Value := 600000)
myGui.AddButton("x345 y100 w45", "15m").OnEvent("Click", (*) => input3.Value := 900000)
myGui.AddButton("x395 y100 w45", "20m").OnEvent("Click", (*) => input3.Value := 1200000)

; ===== Buy packs =====
buyPacksToggle := myGui.AddCheckbox("x10 y140 w100 Checked", "Buy Packs")
buyPacksToggle.OnEvent("Click", ToggleBuyPackUI)

myGui.AddText("x120 y142 w80", "Buy Count:")
buyCountInput := myGui.AddEdit("x190 y139 w60", buyClickCount)

; ===== Buttons =====
myGui.AddButton("x10 y180 w100", "Start (F7)").OnEvent("Click", StartMacro)
myGui.AddButton("x120 y180 w80", "Stop").OnEvent("Click", StopMacro)

darkToggle := myGui.AddCheckbox("x220 y183 w100", "Dark Mode")
darkToggle.OnEvent("Click", ToggleDarkMode)

myGui.Show("w460 h225")

; ================= HOTKEYS =================
F7::ToggleMacro()
F8::SetPos1()
F9::SetPos2()

; ================= BUY TOGGLE =================

ToggleBuyPackUI(*) {
    global buyPacksEnabled, buyCountInput, buyPacksToggle

    buyPacksEnabled := buyPacksToggle.Value
    buyCountInput.Enabled := buyPacksEnabled
}

; ================= POSITIONS =================

SetPos1(*) {
    global pos1
    MouseGetPos &x, &y
    pos1 := {x: x, y: y}
    ToolTip "KINGDOM set"
    SetTimer () => ToolTip(), -700
}

SetPos2(*) {
    global pos2, buyPacksEnabled
    if !buyPacksEnabled
        return

    MouseGetPos &x, &y
    pos2 := {x: x, y: y}
    ToolTip "BUY set"
    SetTimer () => ToolTip(), -700
}

; ================= CLICK =================

HumanClick(x, y) {
    MouseMove x + 2, y + 2, 2
    Sleep 15
    MouseMove x, y, 2
    Sleep 25
    Click x, y
    Sleep 20
}

; ================= CORE =================

ToggleMacro() {
    global running
    running ? StopMacro() : StartMacro()
}

StartMacro(*) {
    global running, statusText, input1, input3, buyCountInput
    global phase1Delay, phase1Duration, buyClickCount

    phase1Delay := Integer(input1.Value)
    phase1Duration := Integer(input3.Value)
    buyClickCount := Integer(buyCountInput.Value)

    running := true
    statusText.Value := "Status: Running"

    FocusRoblox()
    SetTimer(MainLoop, 10)
}

StopMacro(*) {
    global running, statusText
    running := false
    statusText.Value := "Status: Stopped"
}

FocusRoblox() {
    global targetWin
    if WinExist(targetWin) {
        WinActivate targetWin
        WinWaitActive targetWin, , 1
    }
}

; ================= MAIN =================

MainLoop() {
    global running, pos1, pos2
    global phase1Delay, phase1Duration, phase2Delay
    global buyPacksEnabled, buyClickCount

    if !running {
        SetTimer(MainLoop, 0)
        return
    }

    start := A_TickCount

    while (A_TickCount - start < phase1Duration) {
        if !running
            return

        FocusRoblox()
        HumanClick(pos1.x, pos1.y)
        Sleep phase1Delay
    }

    if !running
        return

    if buyPacksEnabled {
        Loop buyClickCount {
            if !running
                return

            FocusRoblox()
            HumanClick(pos2.x, pos2.y)
            Sleep phase2Delay
        }
    }
}

; ================= DARK MODE =================

ToggleDarkMode(*) {
    global darkMode, myGui, statusText

    darkMode := !darkMode

    if darkMode {
        myGui.BackColor := "202020"
        statusText.SetFont("cFFFFFF")
    } else {
        myGui.BackColor := "F0F0F0"
        statusText.SetFont("c000000")
    }
}
