package scripts

import (
	"fmt"
	"time"

	"go.starlark.net/starlark"
	"go.starlark.net/syntax"
)

// To have more control over the script we intercept the execution every X steps
const interceptSteps = 10

type Script struct {
	ID   string
	Body string
}

type ScriptInstance struct {
	script *Script
	thread *starlark.Thread
	ctx    *ScriptContext
}

func NewInstance(scrip *Script, ctx *ScriptContext) *ScriptInstance {
	thread := &starlark.Thread{
		Name: fmt.Sprintf("user_script_%s", scrip.ID),
		Print: func(_ *starlark.Thread, msg string) {
			fmt.Println(msg)
		},
		Load: func(_ *starlark.Thread, module string) (starlark.StringDict, error) {
			return nil, fmt.Errorf("module loading is not allowed")
		},
		OnMaxSteps: func(t *starlark.Thread) {
			ctx := t.Local("ctx").(*ScriptContext)
			ctx.TotalExecutionSteps += t.Steps
			t.Steps = 0

			if ctx.ExecutionDuration() >= ctx.MaxExecutionDuration {
				t.Cancel("script exceeded max execution duration")
			}

			if ctx.TotalExecutionSteps >= ctx.MaxExecutionSteps {
				t.Cancel("script exceeded max execution steps")
			}
		},
	}
	thread.SetLocal("ctx", ctx)

	thread.SetMaxExecutionSteps(interceptSteps)

	return &ScriptInstance{
		script: scrip,
		thread: thread,
		ctx:    ctx,
	}
}

func (s *ScriptInstance) Run() error {
	s.ctx.TotalExecutionSteps = 0
	s.ctx.ExecutionStartTime = time.Now()
	s.ctx.IdleTime = 0

	predeclared := s.ctx.ToPredeclared()

	_, err := starlark.ExecFileOptions(&syntax.FileOptions{
		Set:             false,
		While:           false,
		TopLevelControl: true,
	}, s.thread, s.script.ID, s.script.Body, predeclared)

	s.ctx.TotalExecutionSteps += s.thread.Steps

	return err
}
