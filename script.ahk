#Requires AutoHotkey v2.0
#SingleInstance Force

version := "1.0"

global running := false
global pos1 := {x: 0, y: 0}
global pos2 := {x: 0, y: 0}
global targetWin := "ahk_exe RobloxPlayerBeta.exe"

global phase1Delay := 2000
global phase2Delay := 500
global phase1Duration := 150000

global darkMode := false

CoordMode "Mouse", "Client"

; ================= GUI =================
GuiClass := Gui
myGui := GuiClass("+AlwaysOnTop")
myGui.SetFont("s10", "Segoe UI")

myGui.Title := "g's oil empire macros"

statusText := myGui.AddText("w350", "Status: Stopped")

myGui.AddText("w350", "F8 = set Kingdom | F9 = set Buy | F7 = start/stop")

input1 := myGui.AddEdit("w100", phase1Delay)
input2 := myGui.AddEdit("w100", phase2Delay)
input3 := myGui.AddEdit("w100", phase1Duration)

myGui.AddButton("x+5 w60", "2.5m").OnEvent("Click", (*) => input3.Value := 150000)
myGui.AddButton("x+5 w50", "5m").OnEvent("Click", (*) => input3.Value := 300000)
myGui.AddButton("x+5 w60", "10m").OnEvent("Click", (*) => input3.Value := 600000)
myGui.AddButton("x+5 w60", "15m").OnEvent("Click", (*) => input3.Value := 900000)
myGui.AddButton("x+5 w60", "20m").OnEvent("Click", (*) => input3.Value := 1200000)

myGui.AddButton("w120", "Start (F7)").OnEvent("Click", StartMacro)
myGui.AddButton("x+10 w120", "Stop").OnEvent("Click", StopMacro)

darkToggle := myGui.AddCheckbox("w120", "Dark Mode")
darkToggle.OnEvent("Click", ToggleDarkMode)

myGui.Show()

; ================= HOTKEYS =================
F7::ToggleMacro()
F8::SetPos1()
F9::SetPos2()

; ================= POSITIONS =================

SetPos1(*) {
    global pos1
    MouseGetPos &x, &y
    pos1 := {x: x, y: y}
    ToolTip "KINGDOM set"
    SetTimer () => ToolTip(), -700
}

SetPos2(*) {
    global pos2
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
    global running, statusText, input1, input2, input3
    global phase1Delay, phase2Delay, phase1Duration

    phase1Delay := Integer(input1.Value)
    phase2Delay := Integer(input2.Value)
    phase1Duration := Integer(input3.Value)

    running := true
    statusText.Value := "Running"

    FocusRoblox()
    SetTimer(MainLoop, 10)
}

StopMacro(*) {
    global running, statusText
    running := false
    statusText.Value := "Stopped"
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

    Loop 5 {
        if !running
            return

        FocusRoblox()
        HumanClick(pos2.x, pos2.y)
        Sleep phase2Delay
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
