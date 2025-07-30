package admin

import (
	"github.com/spf13/cobra"
)

func Setup() *cobra.Command {
	adminRootCMD := &cobra.Command{
		Use:   "admin",
		Short: "Admin commands used for debugging and administration",
	}

	adminRootCMD.AddCommand(impersonateCMD())

	return adminRootCMD
}
