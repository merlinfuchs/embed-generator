package admin

import (
	"github.com/merlinfuchs/embed-generator/embedg-server/config"
	"github.com/merlinfuchs/embed-generator/embedg-server/telemetry"
	"github.com/spf13/cobra"
)

func Setup() *cobra.Command {
	adminRootCMD := &cobra.Command{
		Use:   "admin",
		Short: "Admin commands used for debugging and administration",
		PersistentPreRun: func(cmd *cobra.Command, args []string) {
			config.InitConfig()
			telemetry.SetupLogger()
		},
	}

	adminRootCMD.AddCommand(impersonateCMD())

	return adminRootCMD
}
